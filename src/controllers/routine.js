/*!
 * 
 * Copyright(c) 2017 igor-go <igorgo16@gmail.com>
 * MIT Licensed
 */
const log = require('../logger')
const db = require('../db')

const mod = module.exports

mod.emitExecutionError = (err, socket) => {
  socket.emit('ora_exec_error', { message: log.oraErrorExtract(err.message) })
}

mod.setUserData = async (sessionID, conn, param, nValue, sValue, dValue) => {
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
  await db.execute(sessionID, lSQL, params, {}, conn)
}
/*
begin
  UDO_PACKAGE_NODEWEB_IFACE.SET_USERDATA(A_PARAM_NAME => :A_PARAM_NAME,
                                         A_VALUE_NUM  => :A_VALUE_NUM,
                                         A_VALUE_STR  => :A_VALUE_STR,
                                         A_VALUE_DATE => :A_VALUE_DATE);
end;

 */
