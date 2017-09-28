'use strict'

const staticDicts = module.exports
const log = require('../logger')
const db = require('../db')

staticDicts.getAllUnits = async socket => {
  try {
    const res = await db.execute(socket.sessionID, `
select S01 as UNITNAME
  from table(UDO_PACKAGE_NODEWEB_IFACE.GET_ALL_UNITS)
    `)
    socket.emit('all_unitnames_loaded', res.rows)
  } catch (e) {
    log.error(e)
  }
}

staticDicts.getAllApps = async socket => {
  try {
    const res = await db.execute(socket.sessionID, `
select S01 as APPNAME
  from table(UDO_PACKAGE_NODEWEB_IFACE.GET_ALL_APPS)
    `)
    socket.emit('all_appnames_loaded', res.rows)
  } catch (e) {
    log.error(e)
  }
}

staticDicts.init = socket => {
}
