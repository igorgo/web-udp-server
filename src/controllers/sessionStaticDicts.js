'use strict'

const staticDicts = module.exports
const log = require('../logger')
const db = require('../db')
const _ = require('lodash')

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

staticDicts.getAllBuilds = async socket => {
  try {
    const res = await db.execute(socket.sessionID, `
select S01 as VERSION,
       S02 as RELEASE,
       S03 as BUILD,
       D01 as BUILDDATE
  from table(UDO_PACKAGE_NODEWEB_IFACE.GET_ALL_BUILDS)
    `)
    const rows = res.rows
    let result = [],
      iv = -1,
      ir = -1,
      cv = '',
      cr = ''
    rows.forEach( item => {
      if (item['VERSION'] !== cv) {
        cv = item['VERSION']
        iv = _.findIndex(result, ['version', cv])
        if (iv === -1) {
          iv = result.push({
            version: cv,
            releases: []
          }) - 1
          cr = ''
          ir = -1
        }
      }
      if (item['RELEASE'] !== cr) {
        cr = item['RELEASE']
        ir = _.findIndex(result[iv].releases, ['release', cr])
        if (ir === -1) {
          ir = result[iv].releases.push({
            release: cr,
            builds: []
          }) - 1
        }
      }
      if (item['BUILD']) {
        result[iv].releases[ir].builds.push({
          build: item['BUILD'],
          date: item['BUILDDATE']
        })
      }
    })
    socket.emit('all_builds_loaded', result)
  } catch (e) {
    log.error(e)
  }
}

staticDicts.init = socket => {
}
