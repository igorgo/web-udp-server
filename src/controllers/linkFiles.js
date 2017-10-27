'use strict'

const db = require('../db')
const m = require('../messages')
const {emitExecutionError, checkSession} = require('./routine')
const {
  sockOk,
  SE_LINKFILES_FIND,
  SE_LINKFILES_DOWNLOAD,
  SE_LINKFILES_UPLOAD,
  SE_LINKFILES_DELETE
} = require('../socket-events')

const linkFiles = module.exports

async function getClaimFiles (socket, {sessionID, id }) {
  if (!checkSession(socket, sessionID)) return
  const sql = `
    select S01 as "path",
           N01 as "id",
           N02 as "sizeBite",
		   N03 as "own"
      from table(UDO_PACKAGE_NODEWEB_IFACE.GET_CLAIM_FILES(:RN))  
  `
  const params = db.createParams()
  params.add('RN').dirIn().typeNumber().val(id)
  try {
    const res = await db.execute(sessionID, sql, params)
    socket.emit(sockOk(SE_LINKFILES_FIND), {files: res.rows})
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function getLinkedFile (socket, { sessionID, id }) {
  if (!checkSession(socket, sessionID)) return
  const sql = `
     begin
       UDO_PACKAGE_NODEWEB_IFACE.GET_LINKED_DOC(
         P_RN       => :RN,
         P_FILESIZE => :FILESIZE,
         P_FILENAME => :FILENAME,
         P_MIMETYPE => :MIMETYPE,
         P_DOCDATA  => :DOCDATA
       );
     end;
  `
  const params = db.createParams()
  params.add('RN').dirIn().typeNumber().val(id)
  params.add('FILESIZE').dirOut().typeNumber()
  params.add('FILENAME').dirOut().typeString(1000)
  params.add('MIMETYPE').dirOut().typeString(1000)
  params.add('DOCDATA').dirOut().typeBlob()
  try {
    const conn = await db.getConnection(sessionID)
    const res = await db.execute(sessionID, sql, params, {}, conn)
    const file = res.outBinds['DOCDATA']
    if (file === null) {
      conn.close()
      emitExecutionError(new Error(m.MSG_READ_FILE_ERROR), socket)
      return
    }
    let chunks = []
    file.on('data', data => chunks.push(data))
    file.on('end', () => {
    })
    file.on('close', () => {
      const buf = Buffer.concat(chunks)
      socket.emit(sockOk(SE_LINKFILES_DOWNLOAD), {
        fileData: new Uint8Array(buf).buffer,
        fileName: res.outBinds['FILENAME'],
        fileSize: res.outBinds['FILESIZE'],
        mimeType: res.outBinds['MIMETYPE']
      })
      conn.close()
    })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

async function actClaimAttachFile (socket, { sessionID, id, filename, content }) {
  if (!checkSession(socket, sessionID)) return
  const sql = `
    begin
      UDO_PACKAGE_NODEWEB_IFACE.ACT_ADD_DOC(
        P_RN       => :RN,
        P_FILENAME => :FILENAME,
        P_FILE     => :FILE
      );
    end;
  `
  const params = db.createParams()
  params.add('RN').dirIn().typeNumber().val(id)
  params.add('FILENAME').dirIn().typeString().val(filename)
  params.add('FILE').dirIn().typeBuffer().val(content)
  try {
    const res = await db.execute(sessionID, sql, params)
    socket.emit(sockOk(SE_LINKFILES_UPLOAD), { id, filename })
  }
  catch (e) {
    emitExecutionError(e, socket)
  }
}

linkFiles.init = socket => {
  socket.on(SE_LINKFILES_DOWNLOAD, (data) => {
    void getLinkedFile(socket, data)
  })
  socket.on(SE_LINKFILES_FIND, (pl) => {
    void getClaimFiles(socket, pl)
  })
  socket.on(SE_LINKFILES_UPLOAD, (pl) => {
    void actClaimAttachFile(socket, pl)
  })
  socket.on(SE_LINKFILES_DELETE, async ({sessionID, id}) => {
    if (!checkSession(socket, sessionID)) return
    const sql = `
    begin
      UDO_PACKAGE_NODEWEB_IFACE.ACT_DOC_DELETE(
        P_RN       => :RN
      );
    end;`
    const params = db.createParams()
    params.add('RN').dirIn().typeNumber().val(id)
    try {
      const res = await db.execute(sessionID, sql, params)
      socket.emit(sockOk(SE_LINKFILES_DELETE), {id})
    }
    catch (e) {
      emitExecutionError(e, socket)
    }
  })
}
linkFiles.getClaimFiles = getClaimFiles
