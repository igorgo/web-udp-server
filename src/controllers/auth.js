'use strict'

const log = require('../logger')
const db = require('../db')
const sessions = require('../sessions')
const userData = require('./userData')
const sessionStatic = require('./sessionStaticDicts')
const auth = module.exports

async function login(socket, { user, pass }) {
  try {
    const res = await db.logon(user, pass)
    sessions.start(res.sessionID)
    const params = db.createParams()
    params.add('IS_PMO').dirOut().typeNumber()
    const env = await db.execute(res.sessionID, 'begin UDO_PACKAGE_NODEWEB_IFACE.SET_ENV(:IS_PMO); end;',params)
    res.isPmo = env['outBinds']['IS_PMO']
    sessions.set(res.sessionID, sessions.keys.IS_PMO, res.isPmo)
    sessions.set(res.sessionID, sessions.keys.FULL_NAME, res.userFullName)
    socket.emit('authorized', res)
    void userData.getAllUserData(socket)
    void sessionStatic.getAllUnits(socket, res.sessionID)
    void sessionStatic.getAllApps(socket, res.sessionID)
    void sessionStatic.getAllBuilds(socket, res.sessionID)
    void sessionStatic.getAllPersons(socket, res.sessionID)
  } catch (e) {
    log.error(e)
    socket.emit('auth_error', {message: log.oraErrorExtract(e.message)})
  }
}

async function logoff(socket, {sessionID}) {
  try {
    void await db.logoff(sessionID)
    socket.emit('unauthorized')
  } catch (e) {
    log.error(e)
    socket.emit('unauthorized', {message: log.oraErrorExtract(e.message)})
  }
}

async function validate(socket, { sessionID }) {
  try {
    const conn = await db.getConnection(sessionID)
    conn.close()
    socket.emit('session_validated')
  } catch (e) {
    socket.emit('session_not_valid')
  }
}

auth.init = socket => {
  socket.on('authenticate', (d) => {
    void login(socket, d)
  })
  socket.on('logoff', (pl) => {
    void logoff(socket, pl)
  })
  socket.on('validate_session', (d) => {
    void validate(socket, d)
  })
}
