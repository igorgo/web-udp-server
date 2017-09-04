'use strict'

const log = require('../logger')
const db = require('../db')

const auth = module.exports

async function getUserData (socket, user) {
  try {
    const res = await db.executePub(`
select S02 as PARAM_NAME,
       S01 as STR_VAL,
       N01 as NUM_VAL,
       D01 as DAT_VAL
  from table(UDO_PACKAGE_NODEWEB_IFACE.GET_USERDATA)
    `)
    socket.emit('user_data_loaded', res.rows)
  }
}

async function login (socket, data) {
  try {
    const res = await db.logon(data.user, data.pass)
    socket.emit('authorized', res)
  } catch (e) {
    log.error(e)
    socket.emit('auth_error', { message: log.oraErrorExtract(e.message) })
  }
}

async function logoff (socket, data) {
  try {
    const res = await db.logoff(data.sessionID)
    socket.emit('unauthorized')
  } catch (e) {
    log.error(e)
    socket.emit('unauthorized', { message: log.oraErrorExtract(e.message) })
  }
}

async function validate (socket, data) {
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
