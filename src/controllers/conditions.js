'use strict'

const m = require('../messages')
const db = require('../db')
const routine = require('./routine')
const _ = require('lodash')

const conditions = module.exports

async function getClaimConditions (socket) {
  if (socket.sessionID) {
    try {
      const res = await db.execute(socket.sessionID, 'select N01 RN, S01 SNAME, S02 EDITABLE from table(UDO_PACKAGE_NODEWEB_IFACE.GET_CONDITIONS_LIST)')
      socket.emit('claim_conditions_list', res.rows)
    } catch (e) {
      routine.emitExecutionError(e, socket)
    }

  } else socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
}

async function getClaimCondition (socket, pl) {
  if (socket.sessionID) {
    const sql = `
      begin
        UDO_PACKAGE_NODEWEB_IFACE.GET_CONDITION(
          P_RN            => :P_RN,
          P_FILTER_NAME   => :P_FILTER_NAME,
          P_CLAIM_NUMB    => :P_CLAIM_NUMB,
          P_CLAIM_VERS    => :P_CLAIM_VERS,
          P_CLAIM_RELEASE => :P_CLAIM_RELEASE,
          P_CLAIM_BUILD   => :P_CLAIM_BUILD,
          P_CLAIM_UNIT    => :P_CLAIM_UNIT,
          P_CLAIM_APP     => :P_CLAIM_APP,
          P_CLAIM_IM_INIT => :P_CLAIM_IM_INIT,
          P_CLAIM_IM_PERF => :P_CLAIM_IM_PERF,
          P_CLAIM_CONTENT => :P_CLAIM_CONTENT
        );
      end;
   `
    const params = db.createParams()
    params.add('P_RN').dirInOut().typeNumber().val(_.get(pl, 'conditionId', null))
    params.add('P_FILTER_NAME').dirOut().typeString(1000)
    params.add('P_CLAIM_NUMB').dirOut().typeString(1000)
    params.add('P_CLAIM_VERS').dirOut().typeString(1000)
    params.add('P_CLAIM_RELEASE').dirOut().typeString(1000)
    params.add('P_CLAIM_BUILD').dirOut().typeString(1000)
    params.add('P_CLAIM_UNIT').dirOut().typeString(1000)
    params.add('P_CLAIM_APP').dirOut().typeString(1000)
    params.add('P_CLAIM_IM_INIT').dirOut().typeNumber()
    params.add('P_CLAIM_IM_PERF').dirOut().typeNumber()
    params.add('P_CLAIM_CONTENT').dirOut().typeString(1000)
    try {
      const res = await db.execute(socket.sessionID, sql, params)
      socket.emit('claim_condition_got', res.outBinds)
    } catch (e) {
      routine.emitExecutionError(e, socket)
    }
  } else socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
}

async function saveClaimCondition (socket, {
  rn,
  name,
  claimNumb,
  claimVersion,
  claimRelease,
  claimBuild,
  claimUnit,
  claimApp,
  imInitiator,
  imExecutor,
  claimContent
}) {
  if (!socket.sessionID) {
    socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
    return
  }
  const sql = `begin
    UDO_PACKAGE_NODEWEB_IFACE.STORE_FILTER(
      P_FILTER_RN     => :P_FILTER_RN,
      P_FILTER_NAME   => :P_FILTER_NAME,
      P_CLAIM_NUMB    => :P_CLAIM_NUMB,
      P_CLAIM_VERS    => :P_CLAIM_VERS,
      P_CLAIM_RELEASE => :P_CLAIM_RELEASE,
      P_CLAIM_BUILD   => :P_CLAIM_BUILD,
      P_CLAIM_UNIT    => :P_CLAIM_UNIT,
      P_CLAIM_APP     => :P_CLAIM_APP,
      P_CLAIM_IM_INIT => :P_CLAIM_IM_INIT,
      P_CLAIM_IM_PERF => :P_CLAIM_IM_PERF,
      P_CLAIM_CONTENT => :P_CLAIM_CONTENT,
      P_OUT_RN        => :P_OUT_RN
    );
  end;`
  const params = db.createParams()
  params.add('P_FILTER_RN').dirIn().typeNumber().val(rn)
  params.add('P_FILTER_NAME').dirIn().typeString().val(name)
  params.add('P_CLAIM_NUMB').dirIn().typeString().val(claimNumb)
  params.add('P_CLAIM_VERS').dirIn().typeString().val(claimVersion)
  params.add('P_CLAIM_RELEASE').dirIn().typeString().val(claimRelease)
  params.add('P_CLAIM_BUILD').dirIn().typeString().val(claimBuild)
  params.add('P_CLAIM_UNIT').dirIn().typeString().val(claimUnit)
  params.add('P_CLAIM_APP').dirIn().typeString().val(claimApp)
  params.add('P_CLAIM_IM_INIT').dirIn().typeNumber().val(imInitiator)
  params.add('P_CLAIM_IM_PERF').dirIn().typeNumber().val(imExecutor)
  params.add('P_CLAIM_CONTENT').dirIn().typeString().val(claimContent)
  params.add('P_OUT_RN').dirOut().typeNumber()
  try {
    const res = await db.execute(socket.sessionID, sql, params)
    socket.emit('claim_condition_saved', res.outBinds)
  } catch (e) {
    routine.emitExecutionError(e, socket)
  }
}

async function deleteClaimCondition (socket, { rn }) {
  if (!socket.sessionID) {
    socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
    return
  }
  const sql = `begin
    UDO_PACKAGE_NODEWEB_IFACE.DELETE_FILTER(
      P_FILTER_RN => :P_FILTER_RN
    );
  end;`
  const params = db.createParams()
  params.add('P_FILTER_RN').dirIn().typeNumber().val(rn)
  try {
    await db.execute(socket.sessionID, sql, params)
    socket.emit('claim_condition_deleted')
  } catch (e) {
    routine.emitExecutionError(e, socket)
  }
}

conditions.init = socket => {
  socket.on('get_claim_conditions_list', () => {
    void getClaimConditions(socket)
  })
  socket.on('get_claim_condition', (pl) => {
    void getClaimCondition(socket, pl)
  })
  socket.on('save_claim_condition', (pl) => {
    void saveClaimCondition(socket, pl)
  })
  socket.on('delete_claim_condition', (pl) => {
    void deleteClaimCondition(socket, pl)
  })

}

