'use strict'

const log = require('../logger')
const db = require('../db')
// const sessions = require('../sessions')
const userData = require('./userData')
const sessionStatic = require('./sessionStaticDicts')
const {
  sockOk,
  sockErr,
  SE_AUTH_LOGIN,
  SE_AUTH_LOGOFF,
  SE_AUTH_VALIDATE
} = require('../socket-events')
const auth = module.exports

auth.init = socket => {
  socket.on(SE_AUTH_LOGIN, (d) => {
    void login(socket, d)
  })
  socket.on(SE_AUTH_LOGOFF, (pl) => {
    void logoff(socket, pl)
  })
  socket.on(SE_AUTH_VALIDATE, (d) => {
    void validate(socket, d)
  })
}

async function login(socket, { user, pass }) {
  try {
    const res = await db.logon(user, pass)
//    sessions.start(res.sessionID)
    const params = db.createParams()
    params.add('IS_PMO').dirOut().typeNumber()
    const env = await db.execute(res.sessionID, 'begin UDO_PACKAGE_NODEWEB_IFACE.SET_ENV(:IS_PMO); end;',params)
    res.isPmo = env['outBinds']['IS_PMO']
//    sessions.set(res.sessionID, sessions.keys.IS_PMO, res.isPmo)
//    sessions.set(res.sessionID, sessions.keys.FULL_NAME, res.userFullName)
//    sessions.set(res.sessionID, sessions.keys.NCOMPANY, res.nCompany)
    socket.emit(sockOk(SE_AUTH_LOGIN), res)
    void userData.getAllUserData(socket, {sessionID: res.sessionID})
    void sessionStatic.getAllUnits(socket, {sessionID: res.sessionID})
    void sessionStatic.getAllApps(socket, {sessionID: res.sessionID})
    void sessionStatic.getAllBuilds(socket, {sessionID: res.sessionID})
    void sessionStatic.getAllPersons(socket, {sessionID: res.sessionID})
    void sessionStatic.getAllStatuses(socket, {sessionID: res.sessionID})
  } catch (e) {
    log.error(e)
    socket.emit(sockErr(SE_AUTH_LOGIN), {message: log.oraErrorExtract(e.message)})
  }
}

async function logoff(socket, {sessionID}) {
  try {
    void await db.logoff(sessionID)
    socket.emit(sockOk(SE_AUTH_LOGOFF))
  } catch (e) {
    log.error(e)
    socket.emit(sockErr(SE_AUTH_LOGOFF), {message: log.oraErrorExtract(e.message)})
  }
}

async function validate(socket, { sessionID }) {
  try {
    const conn = await db.getConnection(sessionID)
    conn.close()
    socket.emit(sockOk(SE_AUTH_VALIDATE))
  } catch (e) {
    socket.emit(sockErr(SE_AUTH_VALIDATE))
  }
}

