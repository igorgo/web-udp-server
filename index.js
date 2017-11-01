'use strict'

global.rootRequire = function(name) {
  return require(__dirname + '/' + name);
}

const cluster = require('cluster')
const numCPUs = require('os').cpus().length
const path = require('path')
const fs = require('fs')
const pkg = require('./package.json')
const log = require('./src/logger')
const db = require('./src/db')
/**
 * @property {function} argv
 * @property {function} defaults
 * @property {function} set
 */
const nconf = require('nconf')

const configFile = path.join(__dirname, '/config.json')
const configExists = fs.existsSync(configFile)

async function loadConfig() {
  if (!configExists) {
    process.stdout.write('\nConfig file does not exist. First you must run\n\tnode setup\n')
    process.exit(-1)
  }
  nconf.argv().env({
    separator: '__',
    lowerCase: true
  })
  nconf.file({
    file: configFile
  })
  nconf.defaults({
    baseDir: __dirname,
    version: pkg.version
  })
  if (!nconf.get('isCluster')) {
    nconf.set('isPrimary', 'true')
    nconf.set('isCluster', 'false')
  }
}

async function versionCheck() {
  const nodeVer = process.version.slice(1)
  const range = pkg.engines.node
  const semVer = require('semver')
  const compatible = semVer.satisfies(nodeVer, range)
  if (!compatible) {
    process.stdout.write('Your version of Node.js is too outdated.;' +
      'Please update your version of Node.js.;' +
      `Recommended ${range}, provided ${nodeVer}.`)
    process.exit(-1)
  }
}

function addProcessHandlers() {
  process.on('SIGTERM', async () => {
    await shutdown(0)
  })
  process.on('SIGINT', async () => {
    await shutdown(0)
  })
  process.on('SIGHUP', async () => {
    await shutdown(0)
  })
  process.on('message', message => {
    if (typeof message !== 'object') {
      return
    }
    switch (message.action) {
      case 'restart':
        break
    }
  })

  process.on('uncaughtException', async err => {
    await log.error(err)
    await shutdown(2)
  })
  process.on('unhandledRejection', async err => {
    await log.error(err)
    await shutdown(2)
  })
}

async function runServer() {
  await loadConfig()
  await log.init()
  await log.open()

  /* addProcessHandlers()
  await versionCheck()
  process.isMaster = true
  await log.open()
  await db.open()
  void require('./src/server').listen()
  */
  if (cluster.isMaster) {
    // Fork workers.
    process.on('SIGINT', async () => {
      await shutdown(0)
    })
    await versionCheck()
    for (let i = 0; i < numCPUs; ++i) {
      cluster.fork()
    }
    /* if (nconf.get('daemon')) {
      return require('daemon')({
        stdout: process.stdout,
        stderr: process.stderr,
        cwd: process.cwd()
      })
    }*/

    cluster.on('exit', (worker, code, signal) => {
      process.stdout.write('worker ' + worker.process.pid + ' died\n')
      if (code===2) cluster.fork()
    })
    process.isMaster = true
    process.isWorker = false
  } else {
    addProcessHandlers()
    process.isMaster = false
    process.isWorker = true
    await db.open()
    void require('./src/server').listen()
  }
}

async function shutdown(code) {
  if (process.isMaster && code===2) return
  const msg = code===2 ? 'The worker will be restarted due error.' : 'Shutdown (SIGTERM/SIGINT) Initialised.'
  await log.server(msg)
  try {
    await db.close()
    await log.server('Database connection closed.')
  } catch (e) {
    log.error(e)
  }
  await log.server('Shutdown complete.')
  await log.close()

  process.exit(code)
}

void runServer()
