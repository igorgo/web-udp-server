/*!
 * 
 * Copyright(c) 2017 igor-go <igorgo16@gmail.com>
 * MIT Licensed
 */
const log = require('../logger')

const mod = module.exports

mod.emitExecutionError = (err, socket) => {
  log.error(err)
  socket.emit('ora_exec_error', { message: log.oraErrorExtract(err.message) })
}
