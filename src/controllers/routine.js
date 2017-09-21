/*!
 * 
 * Copyright(c) 2017 igor-go <igorgo16@gmail.com>
 * MIT Licensed
 */
const log = require('../logger')
const db = require('../db')

const mod = module.exports

mod.emitExecutionError = (err, socket) => {
  socket.emit('ora_exec_error', { message: log.oraErrorExtract(err.message) })
}

