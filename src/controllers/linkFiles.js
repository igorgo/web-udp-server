'use strict'

const db = require('../db')
const m = require('../messages')
const routine = require('./routine')

const linkFiles = module.exports

async function getClaimFiles (socket, {sessionID, id }) {
  if (!sessionID) {
    socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
    return
  }
  const sql = `
    select S01 as "path",
           N01 as "id",
           N02 as "sizeBite"
      from table(UDO_PACKAGE_NODEWEB_IFACE.GET_CLAIM_FILES(:RN))  
  `
  const params = db.createParams()
  params.add('RN').dirIn().typeNumber().val(id)
  try {
    const res = await db.execute(sessionID, sql, params)
    socket.emit('claim_files_got', {files: res.rows})
  }
  catch (e) {
    routine.emitExecutionError(e, socket)
  }
}

async function getLinkedFile (socket, { sessionID, id }) {
  if (!sessionID) {
    socket.emit('unauthorized', { message: m.MSG_DONT_AUTHORIZED })
    return
  }
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
      routine.emitExecutionError(new Error(m.MSG_READ_FILE_ERROR), socket)
      return
    }
    let chunks = []
    file.on('data', data => chunks.push(data))
    file.on('end', () => {
    })
    file.on('close', () => {
      const buf = Buffer.concat(chunks)
      socket.emit('linked_file_got', {
        fileData: new Uint8Array(buf).buffer,
        fileName: res.outBinds['FILENAME'],
        fileSize: res.outBinds['FILESIZE'],
        mimeType: res.outBinds['MIMETYPE']
      })
      conn.close()
    })
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
      UDO_PACKAGE_NODEWEB_IFACE.ACT_ADD_DOC(
        P_RN       => :P_RN,
        P_FILENAME => :P_FILENAME,
        P_FILE     => :P_FILE
      );
    end;
  `
}

linkFiles.init = socket => {
  socket.on('get_linked_file', (data) => {
    void getLinkedFile(socket, data)
  })
  socket.on('get_claim_files', (pl) => {
    void getClaimFiles(socket, pl)
  })
  socket.on('act_claim_add_file', (pl) => {
    void actClaimAddFile(socket, pl)
  })
}
linkFiles.getClaimFiles = getClaimFiles
