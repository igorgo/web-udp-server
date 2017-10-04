'use strict'

const nconf = require('nconf')
const common = require('./common')
const concolor = require('concolor')
const path = require('path')
const _ = require('lodash')
const mkdirp = require('mkdirp')
const fs = require('fs')
const c = require('./constants')

const DAY_MILLISECONDS = common.duration('1d')
const SEMICOLON_REGEXP = /;/g

const colorError = concolor('b,red')
const colorDebug = concolor('b,green')
const colorWarn = concolor('b,yellow')

/**
 * @property {function} server
 * @property {function} error
 * @property {function} debug
 * @property {function} warning
 * @property {function} access
 * @property {function} auth
 * @property {function} slow
 */
const log = module.exports

log.stringifyObject = (aObject) => {
  let cache = []
  const result = JSON.stringify(aObject, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return
      }
      // Store value in our collection
      cache.push(value)
    }
    return value
  }, 2)
  cache = null
  return result
}

log.fileTypes = ['server', 'error', 'debug', 'warning', 'access', 'auth', 'slow']

log.dir = path.join(c.DIR, 'log')
log.files = new Map()

log.oraErrorExtract = msg => {
  const messages = msg.split(/ORA-\d\d\d\d\d:\s/)
  if (messages.length>1) return messages[1]
  else return msg
}


log.init = () => {
  log.active = false
  if (!nconf.get('app:log')) return
  const makeTimer = fileType => (() => log.flush(fileType))

  log.open = async () => {
    /**
     * @type String
     */
    log.writeInterval = nconf.get('log:write')
    log.bufferSize = nconf.get('log:buffer') * 1024
    log.keepDays = nconf.get('log:keep')
    try {
      mkdirp.sync(log.dir)
    } catch (e) {
      console.error(e)
      return
    }
    const now = new Date()
    const nextDate = new Date()
    await Promise.all(_.map(
      log.fileTypes,
      async fileType => await log.openFile(fileType)
    ))
    log.active = true
    nextDate.setUTCHours(0, 0, 0, 0)
    const nextReopen = nextDate - now + DAY_MILLISECONDS
    setTimeout(log.open, nextReopen)
    if (log.keepDays) {
      log.deleteOldFiles()
    }
  }

  log.openFile = async (aFileType, aOnOpen, aOnError) => {
    const date = common.nowDate()
    const fileName = path.join(log.dir, date + '-' + aFileType + '.log')
    await log.closeFile(aFileType)
    const stream = fs.createWriteStream(fileName, {
      flags: 'a',
      highWaterMark: log.bufferSize
    })
    const timer = setInterval(
      makeTimer(aFileType),
      common.duration(log.writeInterval)
    )
    /**
     * @property {WriteStream} stream
     * @property {String} buf
     * @property {Boolean} lock
     * @property timer
     */
    const file = { stream, buf: '', lock: false, timer }
    log.files.set(aFileType, file)
    if (aOnOpen) file.stream.on('open', aOnOpen)
    if (aOnError) file.stream.on('error', aOnError)
  }

  log.close = async () => {
    if (!log.active) return
    log.active = false
    await Promise.all(_.map(
      log.fileTypes,
      async fileType => await log.closeFile(fileType)
    ))
  }

  log.closeFile = aFileType => new Promise(async resolve => {
    const file = log.files.get(aFileType)
    if (!file) {
      resolve()
      return
    }
    const filePath = file.stream.path
    await log.flush(aFileType)
    if (file.stream.closed) {
      resolve()
      return
    }
    file.stream.end(() => {
      clearInterval(file.timer)
      log.files.delete(aFileType)
      fs.stat(filePath, (e, stats) => {
        if (e || stats.size > 0) {
          resolve()
          return
        }
        fs.unlink(filePath, resolve)
      })
    })
  })

  log.deleteOldFiles = () => {
    fs.readdir(log.dir, (e, fileList) => {
      const now = new Date()
      const date = new Date(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0
      )
      const time = date.getTime()
      let i, fileTime, fileAge
      for (i in fileList) {
        fileTime = new Date(fileList[i].substring(0, 10)).getTime()
        fileAge = Math.floor((time - fileTime) / DAY_MILLISECONDS)
        if (fileAge > 1 && fileAge > log.keepDays) {
          fs.unlink(path.join(log.dir, fileList[i]), common.emptyFunc)
        }
      }
    })
  }

  log.flush = fileType => new Promise(resolve => {
    const file = log.files.get(fileType)
    if (!file || file.lock || file.buf.length === 0) {
      resolve()
      return
    }
    file.lock = true
    const buf = file.buf
    file.buf = ''
    file.stream.write(buf, () => {
      file.lock = false
      resolve()
    })
  })

  log.normalizeStack = (stack) => {
    c.STACK_REGEXP.forEach((rx) => {
      stack = stack.replace(rx[0], rx[1])
    })
    return stack
  }

  log.write = (aFileType, aMessage) => {
    if (!nconf.get('app:log')) return
    const file = log.files.get(aFileType)
    if (!file) return
    if (aMessage instanceof Error) {
      aMessage = log.normalizeStack(aMessage.stack)
    } else if (typeof aMessage === 'object') {
      aMessage = log.stringifyObject(aMessage)
    }
    let msg = new Date().toISOString() + '\t[' + (process.isMaster ? 'M' : 'W') +
      ':'+ process.pid+ ']\t' + aMessage + '\n'
    file.buf += msg
    if (nconf.get('log:stdout').includes(aFileType)) {

      msg = msg.substring(0, msg.length - 1)
      /**/
      if (aFileType === 'debug') {
        msg = colorDebug(log.normalizeStack((new Error(msg)).stack).split(';'))
        _.remove(msg, (v) => v.startsWith(' Object.afs.log.'))
        msg[0] = msg[0].slice(16)
        msg = msg.join('\n')
      } else msg = msg.replace(SEMICOLON_REGEXP, '\n ')

      if (aFileType === 'error') msg = colorError(msg)
      else if (aFileType === 'debug') msg = colorDebug(msg)
      else if (aFileType === 'warning') msg = colorWarn(msg)
      msg = msg.replace(SEMICOLON_REGEXP, '\n ')
      console.log(msg)
    }
  }

  _.forEach(
    log.fileTypes,
    fileType => {
      log[fileType] = message => {
        log.write(fileType, message)
      }
    }
  )
}
