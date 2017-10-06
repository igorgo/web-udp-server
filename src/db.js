'use strict'

/**
 * @type {Provider}
 */
const nconf = require('nconf')
/**
 * @type {oracledb}
 */
const oci = require('oracledb')
const _ = require('lodash')
const common = require('./common')
const log = require('./logger')
const crypto = require('crypto')

/**
 * Oracle Bind Parameter
 */
class OraSqlParam {
  /**
   * Set the parameter's direction to IN
   * @returns {OraSqlParam} IN Param
   */
  dirIn() {
    this.dir = oci.BIND_IN
    return this
  }

  /**
   * Set the parameter's direction to OUT
   * @returns {OraSqlParam} OUT Param
   */
  dirOut() {
    this.dir = oci.BIND_OUT
    return this
  }

  /**
   * Set the parameter's direction to IN/OUT
   * @returns {OraSqlParam} IN/OUT Param
   */
  dirInOut() {
    this.dir = oci.BIND_INOUT
    return this
  }

  /**
   * Set the parameter's  datatype to NUMBER
   * @returns {OraSqlParam} number Param
   */
  typeNumber() {
    this.type = oci.NUMBER
    return this
  }

  /**
   * Set the parameter's  datatype to STRING
   * @param {number} [maxSize] max length of parameter. It's mandatory for OUT string params
   * @returns {OraSqlParam} varchar Param
   */
  typeString(maxSize) {
    this.type = oci.STRING
    if (maxSize) {
      this.maxSize = maxSize
    }
    return this
  }

  /**
   * Set the parameter's  datatype to DATE
   * @returns {OraSqlParam} date Param
   */
  typeDate() {
    this.type = oci.DATE
    return this
  }

  /**
   * Set the parameter's  datatype to CLOB
   * @returns {OraSqlParam} clob Param
   */
  typeClob() {
    this.type = oci.CLOB
    return this
  }

  /**
   * Set the parameter's  datatype to BLOB
   * @returns {OraSqlParam} blob Param
   */
  typeBlob() {
    this.type = oci.BLOB
    return this
  }

  /**
   * Set the parameter's  datatype to BUFFER
   * @returns {OraSqlParam} buffer Param
   */
  typeBuffer(maxSize) {
    this.type = oci.BUFFER
    if (maxSize) {
      this.maxSize = maxSize
    }
    return this
  }

  /**
   * Set the parameter's  value
   * @param {*} value The Param's Value
   * @returns {OraSqlParam} Param with value
   */
  val(value) {
    this.val = value
    return this
  }

  /**
   * Set the parameter's  value
   * @param {string} value The Param's Value
   * @returns {OraSqlParam} Param with value
   */
  sVal(value) {
    this.val = value
    return this
  }

  /**
   * Set the number parameter's  value
   * @param {string} value The Param's Value
   * @returns {OraSqlParam} Param with value
   */
  nVal(value) {
    this.val = parseInt(value, 10)
    return this
  }

  /**
   * Set the date parameter's  value
   * @param {string} value The Param's Value
   * @returns {OraSqlParam} Param with value
   */
  dVal(value) {
    const b = value.split(/\D+/)
    this.val = new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]))
    return this
  }
}

/**
 * Oracle Bind Parameters Collection
 */
class OraSqlParams {
  /**
   * Add parameter to collection
   * @param {string} name The Param's name
   * @returns {OraSqlParam} Added parameter
   */
  add(name) {
    const param = new OraSqlParam()
    _.set(this, name, param)
    return param
  }
}


const db = module.exports

// Constants
const SESSION_TIMEOUT_MINUTES = 60

const SESSION_IMPLEMENTATION = 'Client'

let pool, pubSessionID

db.isOpened = false

const pubKeepAlive = () => {
  if (!db.pubSessionActive) return
  db.getConnectionPub().then((c) => {
    c.close()
  })
}

const pubLogon = async () => {
  db.pubSessionActive = false
  if (!nconf.get('app:public')) return
  const cLogInfo = await db.logon(nconf.get('public:username'), nconf.get('public:password'))
  pubSessionID = cLogInfo.sessionID
  db.pubSessionInfo = cLogInfo
  _.unset(db.pubSessionInfo, 'sessionID')
  db.pubSessionActive = true
  log.server(`The public session is started (user: ${nconf.get('public:username')})`)
  db.pubSessionTimer = setInterval(
    pubKeepAlive,
    common.duration('30m')
  )
}

db.open = async () => {
  if (db.isOpened) return
  log.server('Opening the database…')
  db.schema = nconf.get('oracle:schema')
  db.oldPkgSess = nconf.get('oracle:oldpkgsess')
  db.conectionString = nconf.get('oracle:host') + ':' + nconf.get('oracle:port') +
    '/' + nconf.get('oracle:database')
  oci.outFormat = oci.OBJECT
  oci.maxRows = 10000
  oci.fetchAsString = [oci.CLOB]
  oci.autoCommit = true
  pool = await oci.createPool({
    user: nconf.get('oracle:username'),
    password: nconf.get('oracle:password'),
    connectString: db.conectionString
  })
  db.isOpened = true
  log.server('The database is open')
  await pubLogon()
}

/**
 * @return OraSqlParams
 */
db.createParams = () => new OraSqlParams()

db.close = async () => {
  log.server('Closing the database…')
  if (!db.isOpened) return
  if (db.pubSessionActive) {
    clearInterval(db.pubSessionTimer)
    await db.logoff(pubSessionID)
    log.server('The public session is closed')
  }
  await pool.terminate()
  db.isOpened = false
  log.server('The database is closed')
}

/**
 * Creates connection, sets the session schema, and changes session context to session utilizer
 * @param {string} aSessionId Afina Sequel Session ID
 * @returns {Promise.<oracledb.Connection>} Connection object is obtained by a Pool
 */
db.getConnection = async (aSessionId) => {
  if (!db.isOpened) await db.open()
  const lConnection = await pool.getConnection()
  await lConnection.execute(`alter session set CURRENT_SCHEMA = ${db.schema}`)
  await lConnection.execute('begin PKG_SESSION.VALIDATE_WEB(SCONNECT => :SCONNECT); end;', [aSessionId])
  return lConnection
}

/**
 * Creates connection, sets the session schema, and changes session context to bublic user utilizer
 * @returns {Promise.<oracledb.Connection>} Connection object is obtained by a Pool
 */
db.getConnectionPub = async () => await db.getConnection(pubSessionID)

/**
 * Executes a statement
 * @param {string} aSessionId An Afina Sequel Session ID
 * @param {string} aSql The SQL string that is executed. The SQL string may contain bind parameters.
 * @param {OraSqlParams|Array} [aBindParams] Definintion and values of the bind parameters.
 * It's needed if there are bind parameters in the SQL statement
 * @param {{}|oracledb.IExecuteOptions} [aExecuteOptions] Execution options o control statement execution,
 * such a fetchInfo, outFormat etc.
 * @param {oracledb.Connection} [aConnection] Existing connection. If it is set, then connection won't be closed,
 * if not set the new connection will be open and will be closed after execution
 * @returns {Promise.<oracledb.IExecuteReturn>} The result Object. See https://github.com/oracle/node-oracledb/blob/master/doc/api.md#-result-object-properties
 */
db.execute = async (aSessionId, aSql, aBindParams = [], aExecuteOptions = {}, aConnection = null) => {
  const lConnection = aConnection ? aConnection : (await db.getConnection(aSessionId))
  try {
    return await lConnection.execute(aSql, aBindParams, aExecuteOptions)
  } catch (e) {
    log.error(e)
    throw e
  } finally {
    aConnection || await lConnection.close()
  }
}

db.executePub = async (aSql, aBindParams = [], aExecuteOptions = {}, aConnection = null) => await db.execute(
  pubSessionID, aSql, aBindParams, aExecuteOptions, aConnection
)

/**
 * Logon to AfinaSql by utilizer
 * @param {string} aAfinaUser Afina's user name
 * @param {string} aAfinaWebPassword Afina's user web password
 * @returns {Promise.<Object>} New user session information
 * @property {number} nCompany Session company RN
 * @property {string} userFullName Session user full name
 * @property {string} appName Afina application name
 * @property {string} sCompanyName Session company name
 * @property {string} sessionID  An Afina Sequel Session ID
 */
db.logon = async (aAfinaUser,
                  aAfinaWebPassword) => {
  const lSessionId = (crypto.randomBytes(24)).toString('hex')
  const sqlLogon =
    `begin
       PKG_SESSION.LOGON_WEB(SCONNECT        => :SCONNECT,
                             SUTILIZER       => :SUTILIZER,
                             SPASSWORD       => :SPASSWORD,
                             SIMPLEMENTATION => :SIMPLEMENTATION,
                             SAPPLICATION    => :SAPPLICATION,
                             SCOMPANY        => :SCOMPANY,
                             ${!db.oldPkgSess ? 'SBROWSER        => :SBROWSER,' : ''}
                             SLANGUAGE       => :SLANGUAGE);
     end;`
  const paramsLogin = db.createParams()
  paramsLogin.add('SCONNECT').val(lSessionId)
  paramsLogin.add('SUTILIZER').val(aAfinaUser)
  paramsLogin.add('SPASSWORD').val(aAfinaWebPassword)
  paramsLogin.add('SIMPLEMENTATION').val(SESSION_IMPLEMENTATION)
  paramsLogin.add('SAPPLICATION').val(SESSION_IMPLEMENTATION)
  paramsLogin.add('SCOMPANY').val('ORG')
  paramsLogin.add('SLANGUAGE').val('RUSSIAN')
  !db.oldPkgSess && paramsLogin.add('SBROWSER').val('UDP')
  const sqlTimeout = 'begin PKG_SESSION.TIMEOUT_WEB(:CONNECT, :TIMEOUT); end;'
  const paramsTimeout = db.createParams()
  paramsTimeout.add('CONNECT').val(lSessionId)
  paramsTimeout.add('TIMEOUT').typeNumber().val(SESSION_TIMEOUT_MINUTES)
  const sqlInfo =
    `select 
        PKG_SESSION.GET_COMPANY(0) as NCOMPANY, 
        PKG_SESSION.GET_UTILIZER_NAME() as SFULLUSERNAME, 
        PKG_SESSION.GET_APPLICATION_NAME(0) as SAPPNAME, 
        PKG_SESSION.GET_COMPANY_FULLNAME(0) as SCOMPANYFULLNAME 
    from dual`
  if (!db.isOpened) await db.open()
  const lConnection = await pool.getConnection()
  await lConnection.execute(`alter session set CURRENT_SCHEMA = ${db.schema}`)
  try {
    await lConnection.execute(sqlLogon, paramsLogin, {})
    await lConnection.execute(sqlTimeout, paramsTimeout, {})
    const resultInfo = (await lConnection.execute(sqlInfo, {}, {})).rows[0]
    const result = {
      sessionID: lSessionId,
      nCompany: resultInfo['NCOMPANY'],
      sCompanyName: resultInfo['SCOMPANYFULLNAME'],
      userFullName: resultInfo['SFULLUSERNAME'],
      appName: resultInfo['SAPPNAME']
    }
    let authMessage = 'Session started:'
    authMessage += '\n\tseesion ID: ' + lSessionId
    authMessage += '\n\tuser      : ' + resultInfo['SFULLUSERNAME']
    log.auth(authMessage)
    return result
  } finally {
    await lConnection.close()
  }
}

/**
 * Logs off from AfinaSql
 * @param {string} aSessionId An Afina Sequel Session ID
 * @returns {Promise.<number>} 0 if no errors, -1 if some error occurs
 */
db.logoff = async (aSessionId) => {
  try {
    await db.execute(aSessionId, 'begin PKG_SESSION.LOGOFF_WEB(SCONNECT => :SCONNECT); end;', [aSessionId])
    let authMessage = 'Session finished:'
    authMessage += '\n\tseesion ID: ' + aSessionId
    log.auth(authMessage)
  } catch (e) {
    log.warning('Attempt logoff from non logged session')
  }
}

