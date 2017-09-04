/*!
 * 
 * Copyright(c) 2017 igor-go <igorgo16@gmail.com>
 * MIT Licensed
 */

const log = require('../logger')
const db = require('../db')
const routine = require('./routine')

const mod = module.exports

async function getReleases (socket) {
  try {
    const res = await db.executePub(`
select REL.VER,
       REL.RELNUMB,
       REL.RELNAME,
       REL.RELDATE,
       BLD.BLDNUMB,
       BLD.BLDNAME,
       BLD.DBUILDATE,
       STAT.OPENED,
       STAT.CLOSED
  from (select R.NRN,
               trim(R.SSOFTVERSION) VER,
               trim(R.SRELNUMB) RELNUMB,
               R.SRELNAME RELNAME,
               R.DBEGDATE RELDATE,
               RANK() OVER(order by R.DBEGDATE desc) RNK
          from UDO_V_SOFTRELEASES R
         where R.DBEGDATE is not null) REL,
       (select *
          from (select B.SCODE BLDNUMB,
                       B.SNAME BLDNAME,
                       B.DBUILDATE,
                       B.NPRN,
                       RANK() OVER(partition by B.NPRN order by B.DBUILDATE desc) RNK
                  from UDO_V_SOFTBUILDS B)
         where RNK = 1) BLD,
       (select REL, sum(STATE) CLOSED, count(STATE) - sum(STATE) as OPENED
          from (select NVL(NREL_TO,
                           (select NRN
                              from (select R.NRN,
                                           RANK() OVER(order by R.DBEGDATE desc) RNK
                                      from UDO_V_SOFTRELEASES R
                                     where R.DBEGDATE is not null)
                             where RNK = 1)) REL,
                       S.STATE
                  from UDO_V_CLAIMS C, UDO_CLAIM_STATUSES S
                 where C.NEVENT_STAT = S.NEVENT_STAT
                   and C.NCLOSED = 0
                   and ((NREL_TO is null and S.STATE = 0) or
                       (NREL_TO is not null)))
         group by REL) STAT
 where REL.NRN = STAT.REL
   and BLD.NPRN(+) = REL.NRN
   and REL.RNK < 3
 order by REL.RNK
    `)
    socket.emit('set_cur_releases', res.rows)
  } catch(e) {
    routine.emitExecutionError(e,socket)
  }
}

mod.init = socket => {
  socket.on('get_cur_releases', () => {
    getReleases(socket)
  })
}
