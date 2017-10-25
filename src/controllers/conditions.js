'use strict'

const m = require('../messages')
const db = require('../db')
const {emitExecutionError, checkSession} = require('./routine')
const _ = require('lodash')
const {
  sockOk,
  SE_CONDITIONS_CLAIMS_LIST,
  SE_CONDITIONS_GET_ONE,
  SE_CONDITIONS_SAVE,
  SE_CONDITIONS_DELETE
} = require('../socket-events')
const conditions = module.exports

async function getClaimConditions (socket, {sessionID}) {
  if (checkSession(socket, sessionID)) {
    try {
      const res = await db.execute(sessionID, 'select N01 RN, S01 SNAME, S02 EDITABLE from table(UDO_PACKAGE_NODEWEB_IFACE.GET_CONDITIONS_LIST)')
      socket.emit(sockOk(SE_CONDITIONS_CLAIMS_LIST), {filters:res.rows})
    } catch (e) {
      emitExecutionError(e, socket)
    }
  }
}

async function getClaimCondition (socket, {sessionID, conditionId}) {
  if (checkSession(socket, sessionID)) {
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
    params.add('P_RN').dirInOut().typeNumber().val(conditionId)
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
      const res = await db.execute(sessionID, sql, params)
      socket.emit(sockOk(SE_CONDITIONS_GET_ONE), {filter: res.outBinds})
    } catch (e) {
      emitExecutionError(e, socket)
    }
  }
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
  claimContent,
  sessionID
}) {
  if (!checkSession(socket, sessionID)) {
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
    const res = await db.execute(sessionID, sql, params)
    socket.emit(sockOk(SE_CONDITIONS_SAVE), res.outBinds)
  } catch (e) {
    emitExecutionError(e, socket)
  }
}

async function deleteClaimCondition (socket, { sessionID, rn }) {
  if (!checkSession(socket, sessionID)) {
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
    await db.execute(sessionID, sql, params)
    socket.emit(sockOk(SE_CONDITIONS_DELETE))
  } catch (e) {
    emitExecutionError(e, socket)
  }
}

conditions.init = socket => {
  socket.on(SE_CONDITIONS_CLAIMS_LIST, (pl) => {
    void getClaimConditions(socket, pl)
  })
  socket.on(SE_CONDITIONS_GET_ONE, (pl) => {
    void getClaimCondition(socket, pl)
  })
  socket.on(SE_CONDITIONS_SAVE, (pl) => {
    void saveClaimCondition(socket, pl)
  })
  socket.on(SE_CONDITIONS_DELETE, (pl) => {
    void deleteClaimCondition(socket, pl)
  })

}

