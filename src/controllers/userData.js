'use strict'

const log = require('../logger')
const db = require('../db')
const userData = module.exports

userData.getAllUserData = async socket => {
  try {
    const res = await db.execute(socket.sessionID, `
select S02 as PARAM_NAME,
       S01 as STR_VAL,
       N01 as NUM_VAL,
       D01 as DAT_VAL
  from table(UDO_PACKAGE_NODEWEB_IFACE.GET_USERDATA)
    `)
    socket.emit('user_data_loaded', res.rows)
  } catch (e) {
    log.error(e)
  }
}

async function setUserData (socket, param, nValue, sValue, dValue) {
  const lSQL = `
begin
  UDO_PACKAGE_NODEWEB_IFACE.SET_USERDATA(A_PARAM_NAME => :A_PARAM_NAME,
                                         A_VALUE_NUM  => :A_VALUE_NUM,
                                         A_VALUE_STR  => :A_VALUE_STR,
                                         A_VALUE_DATE => :A_VALUE_DATE);
end;
  `
  const params = db.createParams()
  params.add('A_PARAM_NAME').dirIn().typeString().val(param)
  params.add('A_VALUE_NUM').dirIn().typeNumber().val(nValue)
  params.add('A_VALUE_STR').dirIn().typeString().val(sValue)
  params.add('A_VALUE_DATE').dirIn().typeDate().val(dValue)
  await db.execute(socket.sessionID, lSQL, params)
}


async function setUserDataParam(socket, {param, dataType, value}) {
    if (socket.sessionID) {
      let nVal = null, sVal = null, dVal = null
      switch (dataType) {
        case 'N':
          nVal = value
          break
        case 'S':
          sVal = value
          break
        case 'D':
          dVal = value
      }
      void setUserData(socket, param, nVal, sVal, dVal)
    }
}

userData.init = socket => {
  socket.on('set_user_data_param', (d) => {
    void setUserDataParam(socket, d)
  })
}
