'use strict'

const http = require('http')
const log = require('./logger')
const nconf = require('nconf')

const controllers = require('./controllers')

const server = http.createServer((request, response) => {
  response.end()
})

const io = require('socket.io').listen(server)
io.origins('*:*')
io.on('connection', socket => {
  socket.auth = false
  controllers.initAll(socket)
  socket.on('disconnect', async () => {
    log.access('Disconnecting socket ' + socket.id)
  })
})


module.exports.server = server
module.exports.io = io
module.exports.listen = async () => {
  const port = nconf.get('app:port')
  log.server(`Server started and listen port: ${port}`)
  server.listen(port)
}
