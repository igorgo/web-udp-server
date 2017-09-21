'use strict'

const controllers = module.exports
//const log = require('./logger')

controllers.auth = require('./controllers/auth')
controllers.cr = require('./controllers/curReleases')
controllers.conditions = require('./controllers/conditions')
controllers.claims = require('./controllers/claims')
controllers.userData = require('./controllers/userData')

controllers.initAll = socket => {
  controllers.auth.init(socket)
  controllers.cr.init(socket)
  controllers.conditions.init(socket)
  controllers.claims.init(socket)
  controllers.userData.init(socket)
}
