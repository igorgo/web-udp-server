const m = require('../messages')
const db = require('../db')
const routine = require('./routine')
const log = require('../logger')
const _ = require('lodash')

const claims = module.exports

async function getClaimList (socket, data) {
  if (socket.sessionID) {
    const params = db.createParams()
    const conditionId = _.get(data, 'conditionId', null)
    params.add('A_COND').dirIn().typeNumber().val(conditionId)
    params.add('A_SORT').dirIn().typeString().val(_.get(data, 'sortOrder', null))
    params.add('A_OFFSET').dirIn().typeNumber().val(_.get(data, 'page', 1) - 1)
    params.add('A_LIMIT').dirIn().typeNumber().val(_.get(data, 'limit', 25))
    params.add('A_NEW_RN').dirIn().typeNumber().val(_.get(data, 'newClaimId', null))
    const conn = await db.getConnection(socket.sessionID)
    try {
      const res = await db.execute(socket.sessionID, `
      select * 
        from table(UDO_PACKAGE_NODEWEB_IFACE.GET_CLAIMS(
          :A_COND,
          :A_SORT,
          :A_OFFSET,
          :A_LIMIT,
          :A_NEW_RN
         ))`, params, {}, conn)
      const response = {}
      if (res.rows) {
        response.claims = res.rows.map(rec => {
          return {
            numb: rec['S01'],
            closedInBuild: rec['S02'],
            regDate: rec['D01'],
            unit: rec['S04'],
            apps: rec['S05'],
            status: rec['S06'],
            author: rec['S07'],
            description: rec['S08'],
            executor: rec['S09'],
            executorType: rec['N07'], // 1 - person, 2-department, 0-nobody
            changeDate: rec['D02'],
            id: rec['N01'],
            claimType: rec['N02'], // 1 - feature, 2- rebuke, 3 - bug
            hasReleaseTo: rec['N03'],
            typicalStatus: rec['N04'],
            priority: rec['N05'],
            hasDocs: rec['N06']
          }
        })
        const size = res.rows.length
        if (size === 0)
          response.allCnt = 0
        else if (size === 1)
          response.allCnt = res.rows[0]['N10']
        else if (size > 1)
          response.allCnt = res.rows[1]['N10']
        response.page = _.get(data, 'page', 1)
        response.limit = _.get(data, 'limit', 25)
      }
      socket.emit('claim_list', response)
      await routine.setUserData(socket.sessionID, conn, 'LAST_COND', conditionId, null, null)
      await db.execute(socket.sessionID,'begin UDO_PACKAGE_NODEWEB_IFACE.CLEAR_CONDS; end;', [], {}, conn)
    } catch (e) {
      routine.emitExecutionError(e, socket)
    } finally {
      conn.close()
    }
  } else socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
}

claims.init = socket => {
  socket.on('get_claim_list', (data) => {
    getClaimList(socket, data)
  })
}
