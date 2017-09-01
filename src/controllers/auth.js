'use strict'

const log = require('../logger')

const auth = module.exports

const login = async (socket, data) => {
  try {
    // todo: real login
    log.debug(data)
//    socket.emit('authorized')
    socket.emit('unauthorized', { message: 'HZ' })
  } catch (e) {
    log.error(e)
    socket.emit('unauthorized', { message: e.message })
  }
}

auth.init = socket => {
  // log.debug(socket)
  socket.on('authentication', (d) => {
    login(socket, d)
  })
}
