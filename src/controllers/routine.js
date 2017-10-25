'use strict'

const {oraErrorExtract} = require('../logger')
const {MSG_DONT_AUTHORIZED} = require('../messages')
const {sockErr, SE_AUTH_CHECK, SE_G_ORA_ERROR} = require('../socket-events')

module.exports = {
  emitExecutionError: (err, socket) => {
    socket.emit(sockErr(SE_G_ORA_ERROR), { message: oraErrorExtract(err.message) })
  },
  checkSession: (socket, sessionID) => {
    if (!sessionID) {
      socket.emit(sockErr(SE_AUTH_CHECK), { message: MSG_DONT_AUTHORIZED })
      return false
    } else {
      return true
    }
  }
}
