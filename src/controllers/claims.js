'use strict'

const m = require('../messages')
const db = require('../db')
const routine = require('./routine')
// const log = require('../logger')

const claims = module.exports

async function getClaimList (socket, {
  conditionId = null,
  sortOrder = null,
  page = 1,
  limit = 25,
  newClaimId = null
}) {
  if (socket.sessionID) {
    const params = db.createParams()
    params.add('A_COND').dirIn().typeNumber().val(conditionId)
    params.add('A_SORT').dirIn().typeString().val(sortOrder)
    params.add('A_OFFSET').dirIn().typeNumber().val(page - 1)
    params.add('A_LIMIT').dirIn().typeNumber().val(limit)
    params.add('A_NEW_RN').dirIn().typeNumber().val(newClaimId)
    try {
      const conn = await db.getConnection(socket.sessionID)
      try {
        const res = await db.execute(socket.sessionID, `
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
        await db.execute(socket.sessionID, 'begin UDO_PACKAGE_NODEWEB_IFACE.CLEAR_CONDS; end;', [], {}, conn)
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

async function getClaimRecord (socket, {id}) {
  if (!socket.sessionID) {
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
           S09 as "buildTo",
           S10 as "unit",
           S11 as "app",
           S12 as "action",
           S13 as "content",
  		   N01 as "id",
           N02 as "priority",
           N03 as "helpSign",
           D01 as "registeredAt",
           D02 as "changedAt",
           D03 as "execTill"
      from table(UDO_PACKAGE_NODEWEB_IFACE.GET_CLAIM_RECORD(:RN))
  `
  const params = db.createParams()
  params.add('RN').dirIn().typeNumber().val(id)
  try {
    const res = await db.execute(socket.sessionID, sql, params)
    socket.emit('claim_record_got', res.rows.length ? res.rows[0] : {id: null})
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
}
