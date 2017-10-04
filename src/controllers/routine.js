'use strict'

const log = require('../logger')

const mod = module.exports

mod.emitExecutionError = (err, socket) => {
  socket.emit('ora_exec_error', { message: log.oraErrorExtract(err.message) })
}

