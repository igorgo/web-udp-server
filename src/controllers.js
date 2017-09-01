'use strict'

const controllers = module.exports
//const log = require('./logger')

controllers.auth = require('./controllers/auth')

controllers.initAll = socket => {
  controllers.auth.init(socket)
}
