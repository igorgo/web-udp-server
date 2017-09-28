'use strict'

const controllers = module.exports
const log = require('./logger')
controllers.modules = {}
controllers.modules.auth = require('./controllers/auth')
controllers.modules.cr = require('./controllers/curReleases')
controllers.modules.conditions = require('./controllers/conditions')
controllers.modules.claims = require('./controllers/claims')
controllers.modules.userData = require('./controllers/userData')
controllers.modules.sessionStatic = require('./controllers/sessionStaticDicts')

controllers.initAll = socket => {
  for (let controller in controllers.modules) {
    controllers.modules[controller].init(socket)
  }
/*
  controllers.auth.init(socket)
  controllers.cr.init(socket)
  controllers.conditions.init(socket)
  controllers.claims.init(socket)
  controllers.userData.init(socket)
  controllers..sessStatic.init(socket)
*/
}
