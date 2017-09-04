'use strict'

const log = require('../logger')
const db = require('../db')

const auth = module.exports

const login = async (socket, data) => {
  try {
    const res = await db.logon(data.user, data.pass)
    socket.emit('authorized', res)
  } catch (e) {
    log.error(e)
    socket.emit('auth_error', { message: log.oraErrorExtract(e.message) })
  }
}

const logoff = async (socket, data) => {
  try {
    const res = await db.logoff(data.sessionID)
    socket.emit('unauthorized')
  } catch (e) {
    log.error(e)
    socket.emit('unauthorized', { message: log.oraErrorExtract(e.message) })
  }
}


const validate = async (socket, data) => {
  try {
    const conn = await db.getConnection(data.sessionID)
    conn.close()
    socket.emit('session_validated')
  } catch(e) {
    socket.emit('session_not_valid')
  }

}

auth.init = socket => {
  socket.on('authenticate', (d) => {
    login(socket, d)
  })
  socket.on('logoff', (d) => {
    logoff(socket, d)
  })
  socket.on('validate_session', (d) => {
    validate(socket, d)
  })
}
