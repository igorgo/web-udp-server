'use strict'

const log = require('../logger')
const db = require('../db')
const sessions = require('../sessions')

const auth = module.exports

async function getUserData(socket) {
  try {
    const res = await db.execute(socket.sessionID, `
select S02 as PARAM_NAME,
       S01 as STR_VAL,
       N01 as NUM_VAL,
       D01 as DAT_VAL
  from table(UDO_PACKAGE_NODEWEB_IFACE.GET_USERDATA)
    `)
    socket.emit('user_data_loaded', res.rows)
  } catch (e) {
    log.error(e)
  }
}

async function login(socket, data) {
  try {
    const res = await db.logon(data.user, data.pass)
    socket.sessionID = res.sessionID
    sessions.start(res.sessionID)
    const params = db.createParams()
    params.add('IS_PMO').dirOut().typeNumber()
    const env = await db.execute(socket.sessionID, 'begin UDO_PACKAGE_NODEWEB_IFACE.SET_ENV(:IS_PMO); end;',params)
    res.isPmo = env.outBinds['IS_PMO']
    sessions.set(socket.sessionID, sessions.keys.IS_PMO, env.outBinds['IS_PMO'])
    sessions.set(socket.sessionID, sessions.keys.FULL_NAME, res.userFullName)
    socket.emit('authorized', res)
    void getUserData(socket)
  } catch (e) {
    log.error(e)
    socket.emit('auth_error', {message: log.oraErrorExtract(e.message)})
  }
}

async function logoff(socket) {
  try {
    const res = await db.logoff(socket.sessionID)
    delete socket.sessionID
    socket.emit('unauthorized')
  } catch (e) {
    log.error(e)
    socket.emit('unauthorized', {message: log.oraErrorExtract(e.message)})
  }
}

async function validate(socket, data) {
  try {
    const conn = await db.getConnection(data.sessionID)
    conn.close()
    socket.sessionID = data.sessionID
    socket.emit('session_validated')
  } catch (e) {
    socket.emit('session_not_valid')
  }
}

auth.init = socket => {
  socket.on('authenticate', (d) => {
    void login(socket, d)
  })
  socket.on('logoff', () => {
    void logoff(socket)
  })
  socket.on('validate_session', (d) => {
    void validate(socket, d)
  })
}
