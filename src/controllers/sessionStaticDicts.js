'use strict'

const staticDicts = module.exports
const log = require('../logger')
const db = require('../db')
const _ = require('lodash')
const {
  sockOk,
  SE_STATDICT_ALL_UNITS,
  SE_STATDICT_ALL_APPS,
  SE_STATDICT_ALL_BUILDS,
  SE_STATDICT_ALL_PERSONS,
  SE_APPS_BY_UNIT,
  SE_UNITFUNCS_BY_UNIT,
  SE_STATDICT_ALL_STATUSES
} = require('../socket-events')

staticDicts.getAllUnits = async (socket, {sessionID}) => {
  try {
    const res = await db.execute(sessionID, `
select S01 as UNITNAME
  from table(UDO_PACKAGE_NODEWEB_IFACE.GET_ALL_UNITS)
    `)
    socket.emit(sockOk(SE_STATDICT_ALL_UNITS), {units: res.rows} )
  } catch (e) {
    log.error(e)
  }
}

staticDicts.getAllApps = async (socket, {sessionID}) => {
  try {
    const res = await db.execute(sessionID, `
select S01 as APPNAME
  from table(UDO_PACKAGE_NODEWEB_IFACE.GET_ALL_APPS)
    `)
    socket.emit(sockOk(SE_STATDICT_ALL_APPS), {apps: res.rows})
  } catch (e) {
    log.error(e)
  }
}

staticDicts.getAllBuilds = async (socket, {sessionID}) => {
  try {
    const res = await db.execute(sessionID, `
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
    socket.emit(sockOk(SE_STATDICT_ALL_BUILDS), {builds: result})
  } catch (e) {
    log.error(e)
  }
}

staticDicts.getAllPersons = async (socket, {sessionID}) => {
  const sql = `
    select
        S01 as "label",
        S02 as "code"
      from table(UDO_PACKAGE_NODEWEB_IFACE.GET_ALL_PERSON)
  `
  try {
    const res = await db.execute(sessionID, sql)
    socket.emit(sockOk(SE_STATDICT_ALL_PERSONS), {persons: res.rows})
  } catch (e) {
    log.error(e)
  }
}

staticDicts.getAllStatuses = async (socket, {sessionID}) => {
  const sql = `
    select S01 as "code"
      from table(UDO_PACKAGE_NODEWEB_IFACE.GET_ALL_STATUSES)
  `
  try {
    const res = await db.execute(sessionID, sql)
    socket.emit(sockOk(SE_STATDICT_ALL_STATUSES), {statuses: res.rows})
  } catch (e) {
    log.error(e)
  }
}

async function getAppsByUnits (socket, { sessionID, units }) {
  const sql = `
    select
        S01 as "appName"
      from table(UDO_PACKAGE_NODEWEB_IFACE.GET_APPS_BY_UNIT(:UNITS))
  `
  const params = db.createParams()
  params.add('UNITS').dirIn().typeString().val(units)
  try {
    const res = await db.execute(sessionID, sql, params)
    socket.emit(sockOk(SE_APPS_BY_UNIT), {apps: res.rows})
  } catch (e) {
    log.error(e)
  }
}

async function getFuncsByUnits (socket, { sessionID, units }) {
  const sql = `
    select
        S01 as "funcName"
      from table(UDO_PACKAGE_NODEWEB_IFACE.GET_FUNCS_BY_UNIT(:UNITS))
  `
  const params = db.createParams()
  params.add('UNITS').dirIn().typeString().val(units)
  try {
    const res = await db.execute(sessionID, sql, params)
    socket.emit(sockOk(SE_UNITFUNCS_BY_UNIT), {unitfuncs:res.rows})
  } catch (e) {
    log.error(e)
  }
}

staticDicts.init = socket => {
  socket.on(SE_APPS_BY_UNIT, (pl) => {
    void staticDicts.getAppsByUnits(socket, pl)
  })
  socket.on(SE_UNITFUNCS_BY_UNIT, (pl) => {
    void staticDicts.getFuncsByUnits(socket, pl)
  })
}

staticDicts.getAppsByUnits = getAppsByUnits
staticDicts.getFuncsByUnits = getFuncsByUnits
