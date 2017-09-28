'use strict'

const staticDicts = module.exports

staticDicts.getAllUnits = async socket => {
  try {
    const res = await db.execute(socket.sessionID, `
select S01 as UNITNAME
  from table(UDO_PACKAGE_NODEWEB_IFACE.GET_ALL_UNITS)
    `)
    socket.emit('all_units_loaded', res.rows)
  } catch (e) {
    log.error(e)
  }
}

userData.init = socket => {
}
