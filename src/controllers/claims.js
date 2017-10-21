'use strict'

const m = require('../messages')
const db = require('../db')
const routine = require('./routine')
// const log = require('../logger')
const {getClaimFiles} = require('./linkFiles')

const claims = module.exports

async function getClaimList (socket, {
  sessionID,
  conditionId = null,
  sortOrder = null,
  page = 1,
  limit = 25,
  newClaimId = null
}) {
  if (sessionID) {
    const params = db.createParams()
    params.add('A_COND').dirIn().typeNumber().val(conditionId)
    params.add('A_SORT').dirIn().typeString().val(sortOrder)
    params.add('A_OFFSET').dirIn().typeNumber().val(page - 1)
    params.add('A_LIMIT').dirIn().typeNumber().val(limit)
    params.add('A_NEW_RN').dirIn().typeNumber().val(newClaimId)
    try {
      const conn = await db.getConnection(sessionID)
      try {
        const res = await db.execute(sessionID, `
      select N01 as "id",
             N02 as "claimType",
             N03 as "hasReleaseTo",
             N04 as "typicalStatus",
             N05 as "priority",
             N06 as "hasDocs",
             N08 as "hasBuildTo",
             N07 as "executorType",
             N10 as "allCnt",
             S01 as "numb",
             S02 as "closedInBuild",
             S04 as "unit",
             S05 as "apps",
             S06 as "status",
             S07 as "author",
             S08 as "description",
             S09 as "executor",
             D01 as "regDate",
             D02 as "changeDate"
        from table(UDO_PACKAGE_NODEWEB_IFACE.GET_CLAIMS(
          :A_COND,
          :A_SORT,
          :A_OFFSET,
          :A_LIMIT,
          :A_NEW_RN
         ))`, params, {}, conn)
        const response = {}
        let allCnt = 0
        const rows = res.rows
        if (rows) {
          response.claims = rows.map(rec => {
            let record
            ({allCnt, ...record} = rec)
            return record
          })
          response.allCnt = allCnt
          response.page = page
          response.limit = limit
        }
        socket.emit('claim_list', response)
        await db.execute(sessionID, 'begin UDO_PACKAGE_NODEWEB_IFACE.CLEAR_CONDS; end;', [], {}, conn)
      }
      finally {
        conn.close()
      }
    } catch (e) {
      routine.emitExecutionError(e, socket)
    }
  }
  else
    socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
}

async function getClaimRecord (socket, {sessionID, id}) {
  if (!sessionID) {
    socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
    return
  }
  const sql = `
    select trim(S01) as "claimPrefix",
           trim(S02) as "claimNumber",
           S03 as "claimType",
           S04 as "claimState",
           S05 as "registeredByAgent",
           S06 as "changedByAgent",
           S07 as "executor",
           S08 as "buildFrom",
           S09 as "buildToComb",
           S10 as "unit",
           S11 as "app",
           S12 as "action",
           S13 as "content",
           S14 as "relFrom",
           S15 as "relTo",
           S16 as "buildTo",
  		   N01 as "id",
           N02 as "priority",
           N03 as "helpSign",
           N04 as "claimTypeId",
           N05 as "exexGroupSign",
           D01 as "registeredAt",
           D02 as "changedAt",
           D03 as "execTill"
      from table(UDO_PACKAGE_NODEWEB_IFACE.GET_CLAIM_RECORD(:RN))
  `
  const params = db.createParams()
  params.add('RN').dirIn().typeNumber().val(id)
  try {
    const res = await db.execute(sessionID, sql, params)
    socket.emit('claim_record_got', res.rows.length ? res.rows[0] : {id: null})
    void getClaimHistory (socket, { sessionID, id })
    void getClaimFiles (socket, { sessionID, id })
    void getClaimAvailableActions (socket, { sessionID, id })
  }
  catch (e) {
    routine.emitExecutionError(e, socket)
  }
}

async function getClaimHistory (socket, { sessionID, id }) {
  if (!sessionID) {
    socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
    return
  }
  const sql = `
    select D01 as "date",
           S03 as "who",
           S04 as "newStatus",
           S05 as "newExecutor",
           S06 as "comment"
      from table(UDO_PACKAGE_NODEWEB_IFACE.CLAIM_HISTORY(:RN))  
  `
  const params = db.createParams()
  params.add('RN').dirIn().typeNumber().val(id)
  try {
    const res = await db.execute(sessionID, sql, params)
    socket.emit('claim_history_got', {history: res.rows})
  }
  catch (e) {
    routine.emitExecutionError(e, socket)
  }
}

async function getClaimAvailableActions (socket, { sessionID, id }) {
  if (!sessionID) {
    socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
    return
  }
  const sql = `
    begin
      UDO_PACKAGE_NODEWEB_IFACE.GET_AVAIL_ACTIONS(
        NRN         => :NRN,
        NACTIONMASK => :NACTIONMASK
      );
    end;`
  const params = db.createParams()
  params.add('NRN').dirIn().typeNumber().val(id)
  params.add('NACTIONMASK').dirOut().typeNumber()
  try {
    const res = (await db.execute(sessionID, sql, params))
    socket.emit('claim_avail_actions_got', {id, actionsMask: res.outBinds['NACTIONMASK']})
  }
  catch (e) {
    routine.emitExecutionError(e, socket)
  }
}

async function doClaimDelete (socket, {sessionID, id}) {
  if (!sessionID) {
    socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
    return
  }
  const sql = `
    begin
      UDO_PKG_CLAIMS.CLAIM_DELETE(NRN => :NRN);
    end;`
  const params = db.createParams()
  params.add('NRN').dirIn().typeNumber().val(id)
  try {
    const res = (await db.execute(sessionID, sql, params))
    socket.emit('claim_delete_done')
  }
  catch (e) {
    routine.emitExecutionError(e, socket)
  }
}

async function doClaimUpdate (
  socket, {
    sessionID,
    cId,
    cContent,
    cRelFrom,
    cBldFrom,
    cRelTo,
    cApp,
    cUnit,
    cFunc,
  }) {
  if (!sessionID) {
    socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
    return
  }
  const sql = `
    begin
      UDO_PKG_CLAIMS.CLAIM_UPDATE(
        NRN           => :NRN,
        SLINKED_CLAIM => null,
        SEVENT_DESCR  => :SEVENT_DESCR,
        SREL_FROM     => :SREL_FROM,
        SBUILD_FROM   => :SBUILD_FROM,
        SREL_TO       => :SREL_TO,
        SBUILD_TO     => null,
        SMODULE       => :SMODULE,
        SUNITCODE     => :SUNITCODE,
        SUNITFUNC     => :SUNITFUNC
      );
    end;`
  const params = db.createParams()
  params.add('NRN').dirIn().typeNumber().val(cId)
  params.add('SEVENT_DESCR').dirIn().typeString().val(cContent)
  params.add('SREL_FROM').dirIn().typeString().val(cRelFrom)
  params.add('SBUILD_FROM').dirIn().typeString().val(cBldFrom)
  params.add('SREL_TO').dirIn().typeString().val(cRelTo)
  params.add('SMODULE').dirIn().typeString().val(cApp)
  params.add('SUNITCODE').dirIn().typeString().val(cUnit)
  params.add('SUNITFUNC').dirIn().typeString().val(cFunc)
  try {
    const res = (await db.execute(sessionID, sql, params))
    socket.emit('claim_update_done',{id: cId})
  }
  catch (e) {
    routine.emitExecutionError(e, socket)
  }
}

async function doClaimInsert (
  socket, {
    sessionID,
    cType,
    cPriority,
    cSend,
    cInit,
    cApp,
    cUnit,
    cFunc,
    cContent,
    cRelFrom,
    cBldFrom,
    cRelTo
  }) {
  if (!sessionID) {
    socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
    return
  }
  const sql = `
    begin
      UDO_PKG_CLAIMS.CLAIM_INSERT(
        NCRN                => null,
        SEVENT_TYPE         => :SEVENT_TYPE,
        SLINKED_CLAIM       => null,
        NPRIORITY           => :NPRIORITY,
        NSEND_TO_DEVELOPERS => :NSEND_TO_DEVELOPERS,
        SINIT_PERSON        => :SINIT_PERSON,
        SMODULE             => :SMODULE,
        SUNITCODE           => :SUNITCODE,
        SUNITFUNC           => :SUNITFUNC,
        SEVENT_DESCR        => :SEVENT_DESCR,
        SREL_FROM           => :SREL_FROM,
        SBUILD_FROM         => :SBUILD_FROM,
        SREL_TO             => :SREL_TO,
        NRN                 => :NRN
      );
    end;`
  const params = db.createParams()
  params.add('SEVENT_TYPE').dirIn().typeString().val(cType)
  params.add('NPRIORITY').dirIn().typeNumber().val(cPriority)
  params.add('NSEND_TO_DEVELOPERS').dirIn().typeNumber().val(cSend)
  params.add('SINIT_PERSON').dirIn().typeString().val(cInit)
  params.add('SMODULE').dirIn().typeString().val(cApp)
  params.add('SUNITCODE').dirIn().typeString().val(cUnit)
  params.add('SUNITFUNC').dirIn().typeString().val(cFunc)
  params.add('SEVENT_DESCR').dirIn().typeString().val(cContent)
  params.add('SREL_FROM').dirIn().typeString().val(cRelFrom)
  params.add('SBUILD_FROM').dirIn().typeString().val(cBldFrom)
  params.add('SREL_TO').dirIn().typeString().val(cRelTo)
  params.add('NRN').dirOut().typeNumber()
  try {
    const res = (await db.execute(sessionID, sql, params))
    socket.emit('claim_insert_done',{id: res.outBinds['NRN']})
  }
  catch (e) {
    routine.emitExecutionError(e, socket)
  }
}


claims.init = socket => {
  socket.on('get_claim_list', (data) => {
    void getClaimList(socket, data)
  })
  socket.on('get_claim_record', (pl) => {
    void getClaimRecord(socket, pl)
  })
  socket.on('get_claim_history', (pl) => {
    void getClaimHistory(socket, pl)
  })
  socket.on('get_claim_avail_actions', (pl) => {
    void getClaimAvailableActions(socket, pl)
  })
  socket.on('do_claim_delete', (pl) => {
    void doClaimDelete(socket, pl)
  })
  socket.on('do_claim_update', (pl) => {
    void doClaimUpdate(socket, pl)
  })
  socket.on('do_claim_insert', (pl) => {
    void doClaimInsert(socket, pl)
  })
}
