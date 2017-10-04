'use strict'

const controllers = module.exports
controllers.modules = {}
controllers.modules.auth = require('./controllers/auth')
controllers.modules.cr = require('./controllers/curReleases')
controllers.modules.conditions = require('./controllers/conditions')
controllers.modules.claims = require('./controllers/claims')
controllers.modules.userData = require('./controllers/userData')
controllers.modules.sessionStatic = require('./controllers/sessionStaticDicts')

controllers.initAll = socket => {
  for (let controller in controllers.modules) {
    if (controllers.modules.hasOwnProperty(controller)) controllers.modules[controller].init(socket)
  }
}
