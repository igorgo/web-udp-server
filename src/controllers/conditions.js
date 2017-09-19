'use strict'

const m =require('../messages')
const db =require('../db')
const routine =require('./routine')
const log =require('../logger')

const conditions = module.exports

async function getClaimCondition(socket) {
  if (socket.sessionID) {
    try {
      const res = await db.execute(socket.sessionID, 'select N01 RN, S01 SNAME, S02 EDITABLE from table(UDO_PACKAGE_NODEWEB_IFACE.GET_CONDITIONS_LIST)')
      socket.emit('claim_conditions_list', res.rows)
    } catch (e) {
      routine.emitExecutionError(e,socket)
    }

  } else socket.emit('unauthorized', {message: m.MSG_DONT_AUTHORIZED})
}

conditions.init = socket => {
  socket.on('get_claim_conditions_list', () => {
    getClaimCondition(socket)
  })
}

