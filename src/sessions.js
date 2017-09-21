const _ = require('lodash')

const sessions = module.exports

sessions.set = (id ,key, value) => {
  _.set(sessions, [id, key] , value)
}

sessions.get = (id ,key, defaultValue) => {
  _.get(session, [id, key] , defaultValue)
}

sessions.start = (id) => {
  _.set(sessions, [id], {})
}

sessions.end = (id) => {
  _.unset(sessions,id)
}

const keys = {
  IS_PMO : 'IS_PMO',
  FULL_NAME : 'FULL_NAME',
}

sessions.keys = keys