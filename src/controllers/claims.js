'use strict'

const m = require('../messages')
const db = require('../db')
const {checkSession, emitExecutionError} = require('./routine')
// const log = require('../logger')
const { getClaimFiles } = require('./linkFiles')
const sessions = require('../sessions')
const {
  sockOk,
  SE_CLAIMS_FIND,
  SE_CLAIMS_FIND_ONE,
  SE_CLAIMS_HISTORY_FIND,
  SE_CLAIMS_NEXTPOINTS_FIND,
  SE_CLAIMS_NEXTEXECS_FIND,
  SE_CLAIMS_AVAIL_ACTIONS_FIND,
  SE_CLAIMS_DELETE,
  SE_CLAIMS_ANNUL,
  SE_CLAIMS_UPDATE,
  SE_CLAIMS_SET_STATUS,
  SE_CLAIMS_INSERT,
  SE_CLAIMS_RETURN,
  SE_CLAIMS_RETURN_MESSAGE,
  SE_CLAIMS_SEND,
  SE_CLAIMS_CURREXECS_FIND,
  SE_CLAIMS_NOTE_INSERT,
  SE_CLAIMS_NOTE_UPDATE,
  SE_CLAIMS_NOTE_FIND_ONE,
  SE_CLAIMS_PRIRITIZE,
  SE_CLAIMS_HELP_NEED,
  SE_CLAIMS_HELP_STATUS
} = require('../socket-events')

const claims = module.exports

async function getClaimList (socket, { sessionID, conditionId = null, sortOrder = null, page = 1, limit = 25, newClaimId = null }) {
  if (!checkSession(socket, sessionID)) return
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
             N08 as "executorType",
             N07 as "hasBuildTo",
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
          ({ allCnt, ...record } = rec)
          return record
        })
        response.allCnt = allCnt
        response.page = page
        response.limit = limit
      }
      socket.emit(sockOk(SE_CLAIMS_FIND), {claims: response})
      await db.execute(sessionID, 'begin UDO_PACKAGE_NODEWEB_IFACE.CLEAR_CONDS; end;', [], {}, conn)
    }
    finally {
      conn.close()
    }
  } catch (e) {
    emitExecutionError(e, socket)
  }
}

async function getClaimRecord (socket, { sessionID, id }) {
  if (!checkSession(socket, sessionID)) return
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
    socket.emit(sockOk(SE_CLAIMS_FIND_ONE), {claim: res.rows.length ? res.rows[0] : { id: null }})
    void getClaimHistory(socket, { sessionID, id })
    void getClaimFiles(socket, { sessionID, id })
    void getClaimAvailableActions(socket, { sessionID, id })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function getClaimHistory (socket, { sessionID, id }) {
  if (!checkSession(socket, sessionID)) return
  const sql = `
    select D01 as "date",
           S03 as "who",
           S04 as "newStatus",
           S05 as "newExecutor",
           S06 as "comment",
           N02 as "noteId"
      from table(UDO_PACKAGE_NODEWEB_IFACE.CLAIM_HISTORY(:RN))  
  `
  const params = db.createParams()
  params.add('RN').dirIn().typeNumber().val(id)
  try {
    const res = await db.execute(sessionID, sql, params)
    socket.emit(sockOk(SE_CLAIMS_HISTORY_FIND), { history: res.rows })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function getClaimAvailableActions (socket, { sessionID, id }) {
  if (!checkSession(socket, sessionID)) return
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
    socket.emit(sockOk(SE_CLAIMS_AVAIL_ACTIONS_FIND), { id, actionsMask: res.outBinds['NACTIONMASK'] })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function doClaimDelete (socket, { sessionID, id }) {
  if (!checkSession(socket, sessionID)) return
  const sql = `
    begin
      UDO_PKG_CLAIMS.CLAIM_DELETE(NRN => :NRN);
    end;`
  const params = db.createParams()
  params.add('NRN').dirIn().typeNumber().val(id)
  try {
    const res = (await db.execute(sessionID, sql, params))
    socket.emit(sockOk(SE_CLAIMS_DELETE))
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function doClaimAnnull (socket, { sessionID, id }) {
  if (!checkSession(socket, sessionID)) return
  const sql = `
    begin
      UDO_PKG_CLAIMS.CLAIM_CLOSE(NRN => :NRN);
    end;`
  const params = db.createParams()
  params.add('NRN').dirIn().typeNumber().val(id)
  try {
    const res = (await db.execute(sessionID, sql, params))
    socket.emit(sockOk(SE_CLAIMS_ANNUL))
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function doClaimUpdate (socket, { sessionID, cId, cContent, cRelFrom, cBldFrom, cRelTo, cApp, cUnit, cFunc }) {
  if (!checkSession(socket, sessionID)) return
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
    socket.emit(sockOk(SE_CLAIMS_UPDATE), { id: cId })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function doClaimStatus (socket, { sessionID, cId, cType, cStatus, cSendTo, cNoteHeader, cNote, cPriority, cRelTo, cBldTo }) {
  if (!checkSession(socket, sessionID)) return
  const sql = `
    begin
      UDO_PKG_CLAIMS.CLAIM_CHANGE_STATE(
        NRN            => :NRN,
        SEVENT_TYPE    => :SEVENT_TYPE,
        SEVENT_STAT    => :SEVENT_STAT,
        SSEND_CLIENT   => null,
        SSEND_DIVISION => null,
        SSEND_POST     => null,
        SSEND_PERFORM  => null,
        SSEND_PERSON   => :SSEND_PERSON,
        SNOTE_HEADER   => :SNOTE_HEADER,
        SNOTE          => :SNOTE,
        NPRIORITY      => :NPRIORITY,
        SREL_TO        => :SREL_TO,
        SBUILD_TO      => :SBUILD_TO
      );
    end;`
  const params = db.createParams()
  params.add('NRN').dirIn().typeNumber().val(cId)
  params.add('SEVENT_TYPE').dirIn().typeString().val(cType)
  params.add('SEVENT_STAT').dirIn().typeString().val(cStatus)
  params.add('SSEND_PERSON').dirIn().typeString().val(cSendTo)
  params.add('SNOTE_HEADER').dirIn().typeString().val(cNoteHeader)
  params.add('SNOTE').dirIn().typeString().val(cNote)
  params.add('NPRIORITY').dirIn().typeNumber().val(cPriority)
  params.add('SREL_TO').dirIn().typeString().val(cRelTo)
  params.add('SBUILD_TO').dirIn().typeString().val(cBldTo)
  try {
    const res = (await db.execute(sessionID, sql, params))
    socket.emit(sockOk(SE_CLAIMS_SET_STATUS), { id: cId })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function doClaimSend (socket, { sessionID, cId, cType, cStatus, cSendTo, cNoteHeader, cNote }) {
  if (!checkSession(socket, sessionID)) return
  const sql = `
    begin
      UDO_PKG_CLAIMS.CLAIM_DO_SEND(
        NRN            => :NRN,
        SEVENT_TYPE    => :SEVENT_TYPE,
        SEVENT_STAT    => :SEVENT_STAT,
        SSEND_CLIENT   => null,
        SSEND_DIVISION => null,
        SSEND_POST     => null,
        SSEND_PERFORM  => null,
        SSEND_PERSON   => :SSEND_PERSON,
        SNOTE_HEADER   => :SNOTE_HEADER,
        SNOTE          => :SNOTE
     );
    end;`
  const params = db.createParams()
  params.add('NRN').dirIn().typeNumber().val(cId)
  params.add('SEVENT_TYPE').dirIn().typeString().val(cType)
  params.add('SEVENT_STAT').dirIn().typeString().val(cStatus)
  params.add('SSEND_PERSON').dirIn().typeString().val(cSendTo)
  params.add('SNOTE_HEADER').dirIn().typeString().val(cNoteHeader)
  params.add('SNOTE').dirIn().typeString().val(cNote)
  try {
    const res = (await db.execute(sessionID, sql, params))
    socket.emit(sockOk(SE_CLAIMS_SEND), { id: cId })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function doClaimInsert (socket, { sessionID, cType, cPriority, cSend, cInit, cApp, cUnit, cFunc, cContent, cRelFrom, cBldFrom, cRelTo }) {
  if (!checkSession(socket, sessionID)) return
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
    socket.emit(sockOk(SE_CLAIMS_INSERT), { id: res.outBinds['NRN'] })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function getClaimNextPoints (socket, { sessionID, id }) {
  if (!checkSession(socket, sessionID)) return
  const sql = `
    select 
      S01 as "statCode",
      N01 as "statId",
      N02 as "statType"
    from table(UDO_PACKAGE_NODEWEB_IFACE.GET_NEXTPOINTS(:NRN))
  `
  const params = db.createParams()
  params.add('NRN').dirIn().typeNumber().val(id)
  try {
    const res = await db.execute(sessionID, sql, params)
    socket.emit(sockOk(SE_CLAIMS_NEXTPOINTS_FIND), { points: res.rows })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function getClaimNextExecutors (socket, { sessionID, id, pointId }) {
  if (!checkSession(socket, sessionID)) return
  const sql = `
    select 
      S01 as "value",
      S02 as "label"
    from table(UDO_PACKAGE_NODEWEB_IFACE.GET_NEXTPOINT_EXECUTORS(:NRN, :NPOINT))
  `
  const params = db.createParams()
  params.add('NRN').dirIn().typeNumber().val(id)
  params.add('NPOINT').dirIn().typeNumber().val(pointId)
  try {
    const res = await db.execute(sessionID, sql, params)
    socket.emit(sockOk(SE_CLAIMS_NEXTEXECS_FIND), { executors: res.rows })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function getClaimCurrentExecutors (socket, { sessionID, id }) {
  if (!checkSession(socket, sessionID)) return
  const sql = `
    select 
      S01 as "value",
      S02 as "label"
    from table(UDO_PACKAGE_NODEWEB_IFACE.GET_OTHER_EXECUTORS(:NRN))
  `
  const params = db.createParams()
  params.add('NRN').dirIn().typeNumber().val(id)
  try {
    const res = await db.execute(sessionID, sql, params)
    socket.emit(sockOk(SE_CLAIMS_CURREXECS_FIND), { executors: res.rows })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function getClaimRetMessage (socket, { sessionID, id }) {
  const sql = `
    begin
      FIND_CLNEVENTS_RETPOINT(
        NCOMPANY   => :NCOMPANY,
        NRN        => :NRN,
        NPOINT_OUT => :NPOINT_OUT,
        SCOMMENTRY => :SCOMMENTRY
      );
    end;`
  const params = db.createParams()
  params.add('NRN').dirIn().typeNumber().val(id)
  params.add('NCOMPANY').dirIn().typeNumber().val(sessions.get(sessionID, 'NCOMPANY'))
  params.add('NPOINT_OUT').dirOut().typeNumber()
  params.add('SCOMMENTRY').dirOut().typeString(1000)
  try {
    const res = (await db.execute(sessionID, sql, params))
    socket.emit(sockOk(SE_CLAIMS_RETURN_MESSAGE), { message: res.outBinds['SCOMMENTRY'] })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function doClaimReturn (socket, { sessionID, cId, cNoteHeader, cNote }) {
  if (!checkSession(socket, sessionID)) return
  const sql = `
    begin
      UDO_PKG_CLAIMS.CLAIM_RETURN(
        NRN          => :NRN,
        SNOTE_HEADER => :SNOTE_HEADER,
        SNOTE        => :SNOTE
      );
    end;`
  const params = db.createParams()
  params.add('NRN').dirIn().typeNumber().val(cId)
  params.add('SNOTE_HEADER').dirIn().typeString().val(cNoteHeader)
  params.add('SNOTE').dirIn().typeString().val(cNote)
  try {
    const res = (await db.execute(sessionID, sql, params))
    socket.emit(sockOk(SE_CLAIMS_RETURN), { id: cId })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function doClaimNoteInsert (socket, { sessionID, cId, cNoteHeader, cNote }) {
  if (!checkSession(socket, sessionID)) return
  const sql=`
    begin
      UDO_PACKAGE_NODEWEB_IFACE.ACT_ADD_NOTE(
        P_RN => :P_RN,
        P_NOTE_HEADER => :P_NOTE_HEADER,
        P_NOTE => :P_NOTE
      );
    end;`
  const params = db.createParams()
  params.add('P_RN').dirIn().typeNumber().val(cId)
  params.add('P_NOTE_HEADER').dirIn().typeString().val(cNoteHeader)
  params.add('P_NOTE').dirIn().typeString().val(cNote)
  try {
    const res = (await db.execute(sessionID, sql, params))
    socket.emit(sockOk(SE_CLAIMS_NOTE_INSERT), { id: cId })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

claims.init = socket => {
  socket.on(SE_CLAIMS_FIND, (data) => {
    void getClaimList(socket, data)
  })
  socket.on(SE_CLAIMS_FIND_ONE, (pl) => {
    void getClaimRecord(socket, pl)
  })
  socket.on(SE_CLAIMS_HISTORY_FIND, (pl) => {
    void getClaimHistory(socket, pl)
  })
  socket.on(SE_CLAIMS_NEXTPOINTS_FIND, (pl) => {
    void getClaimNextPoints(socket, pl)
  })
  socket.on(SE_CLAIMS_NEXTEXECS_FIND, (pl) => {
    void getClaimNextExecutors(socket, pl)
  })
  socket.on(SE_CLAIMS_AVAIL_ACTIONS_FIND, (pl) => {
    void getClaimAvailableActions(socket, pl)
  })
  socket.on(SE_CLAIMS_DELETE, (pl) => {
    void doClaimDelete(socket, pl)
  })
  socket.on(SE_CLAIMS_ANNUL, (pl) => {
    void doClaimAnnull(socket, pl)
  })
  socket.on(SE_CLAIMS_UPDATE, (pl) => {
    void doClaimUpdate(socket, pl)
  })
  socket.on(SE_CLAIMS_SET_STATUS, (pl) => {
    void doClaimStatus(socket, pl)
  })
  socket.on(SE_CLAIMS_INSERT, (pl) => {
    void doClaimInsert(socket, pl)
  })
  socket.on(SE_CLAIMS_RETURN, (pl) => {
    void doClaimReturn(socket, pl)
  })
  socket.on(SE_CLAIMS_RETURN_MESSAGE, (pl) => {
    void getClaimRetMessage(socket, pl)
  })
  socket.on(SE_CLAIMS_SEND, (pl) => {
    void doClaimSend(socket, pl)
  })
  socket.on(SE_CLAIMS_CURREXECS_FIND, (pl) => {
    void getClaimCurrentExecutors(socket, pl)
  })
  socket.on(SE_CLAIMS_NOTE_INSERT, (pl) => {
    void doClaimNoteInsert(socket, pl)
  })
  socket.on(SE_CLAIMS_NOTE_UPDATE, async ({sessionID, id, note}) => {
    if (!checkSession(socket, sessionID)) return
    const sql=`
      begin
        UDO_PACKAGE_NODEWEB_IFACE.ACT_EDIT_NOTE(
          P_RN => :P_RN,
          P_NOTE => :P_NOTE
        );
      end;`
    const params = db.createParams()
    params.add('P_RN').dirIn().typeNumber().val(id)
    params.add('P_NOTE').dirIn().typeString().val(note)
    try {
      const res = (await db.execute(sessionID, sql, params))
      socket.emit(sockOk(SE_CLAIMS_NOTE_UPDATE), {id})
    }
    catch (e) {
      emitExecutionError(e, socket)
    }
  })
  socket.on(SE_CLAIMS_NOTE_FIND_ONE, async ({sessionID, id}) => {
    if (!checkSession(socket, sessionID)) return
    const sql=`
      begin
        UDO_PACKAGE_NODEWEB_IFACE.GET_NOTE_ATTR(
          P_RN => :P_RN,
          P_NOTE_HEADER => :P_NOTE_HEADER,
          P_NOTE => :P_NOTE
        );
      end;`
    const params = db.createParams()
    params.add('P_RN').dirIn().typeNumber().val(id)
    params.add('P_NOTE_HEADER').dirOut().typeString(40)
    params.add('P_NOTE').dirOut().typeString(4000)
    try {
      const res = (await db.execute(sessionID, sql, params))
      socket.emit(sockOk(SE_CLAIMS_NOTE_FIND_ONE), {
        id,
        header: res.outBinds['P_NOTE_HEADER'],
        note: res.outBinds['P_NOTE'],
      })
    }
    catch (e) {
      emitExecutionError(e, socket)
    }
  })
  socket.on(SE_CLAIMS_PRIRITIZE,async ({sessionID, id, priority}) => {
    if (!checkSession(socket, sessionID)) return
    const sql=`
      begin
        P_CLNEVENTS_SET_PRIORITY(
          NRN => :NRN,
          NCOMPANY => :NCOMPANY,
          NPRIORITY => :NPRIORITY
        );
      end;`
    const params = db.createParams()
    params.add('NRN').dirIn().typeNumber().val(id)
    params.add('NCOMPANY').dirIn().typeNumber().val(sessions.get(sessionID, 'NCOMPANY'))
    params.add('NPRIORITY').dirIn().typeNumber().val(priority)
    try {
      const res = (await db.execute(sessionID, sql, params))
      socket.emit(sockOk(SE_CLAIMS_PRIRITIZE), {id})
    }
    catch (e) {
      emitExecutionError(e, socket)
    }
  })
  socket.on(SE_CLAIMS_HELP_NEED,async ({sessionID, id, status, note}) => {
    if (!checkSession(socket, sessionID)) return
    const sql=`
      begin
        UDO_PKG_CLAIMS.CLAIM_HELPSIGN_NEED(
          NRN => :NRN,
          NSTATUS => :NSTATUS,
          SNOTE => :SNOTE
        );
      end;`
    const params = db.createParams()
    params.add('NRN').dirIn().typeNumber().val(id)
    params.add('NSTATUS').dirIn().typeNumber().val(status)
    params.add('SNOTE').dirIn().typeString().val(note)
    try {
      const res = (await db.execute(sessionID, sql, params))
      socket.emit(sockOk(SE_CLAIMS_HELP_NEED), {id, status})
    }
    catch (e) {
      emitExecutionError(e, socket)
    }
  })
  socket.on(SE_CLAIMS_HELP_STATUS,async ({sessionID, id, status}) => {
    if (!checkSession(socket, sessionID)) return
    const sql=`
      begin
        UDO_PKG_CLAIMS.CLAIM_HELPSIGN_STAT(
          NRN => :NRN,
          NSTATUS => :NSTATUS
        );
      end;`
    const params = db.createParams()
    params.add('NRN').dirIn().typeNumber().val(id)
    params.add('NSTATUS').dirIn().typeNumber().val(status)
    try {
      const res = (await db.execute(sessionID, sql, params))
      socket.emit(sockOk(SE_CLAIMS_HELP_STATUS), {id, status})
    }
    catch (e) {
      emitExecutionError(e, socket)
    }
  })
}
