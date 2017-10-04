const db = require('../db')
const routine = require('./routine')

const mod = module.exports

async function getReleases (socket) {
  try {
    const res = await db.executePub(`
select S01 as RELNAME,
       S02 as BLDNUMB,
       D01 as RELDATE,
       D02 as DBUILDATE,
       N01 as OPENED,
       N02 as CLOSED
  from table(UDO_PACKAGE_NODEWEB_IFACE.GET_CURRENT_RELEASES)
    `)
    socket.emit('set_cur_releases', res.rows)
  } catch(e) {
    routine.emitExecutionError(e,socket)
  }
}

mod.init = socket => {
  socket.on('get_cur_releases', () => {
    void getReleases(socket)
  })
}
