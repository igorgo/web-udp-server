/*!
 * 
 * Copyright(c) 2017 igor-go <igorgo16@gmail.com>
 * MIT Licensed
 */

/**
 * @type Provider
 */
const util = require('util')
const path = require('path')
const fs = require('fs')
/**
 * @property {function} file
 * @property {function} get
 */
const nconf = require('nconf')
const prompt = require('prompt')
const promptGet = util.promisify(prompt.get)

const doSetup = async () => {
  prompt.start()
  prompt.message = ''
  prompt.delimiter = ''
  prompt.colors = false
  const serverConfigPath = path.join(__dirname, 'config.json')
  nconf.file({
    file: serverConfigPath
  })


  let cfg = {}
  let subConf

  subConf = await promptGet([
    {
      name: 'app:public',
      description: 'Enable public session',
      default: nconf.get('app:public') || true
    },
    {
      name: 'app:log',
      description: 'Write logs',
      default: nconf.get('app:log') || true
    },
    {
      name: 'app:port',
      description: 'Web server port to listen',
      default: nconf.get('port') || 8716
    }
  ])
  cfg.app = {
    public: (subConf['app:public'] !== 'false') && (subConf['app:public'] !== false),
    log: (subConf['app:log'] !== 'false') && (subConf['app:log'] !== false),
    port: subConf['app:port']
  }

  subConf = await promptGet([
    {
      name: 'oracle:host',
      description: 'Host IP or address of your Oracle instance',
      default: nconf.get('oracle:host') || '212.90.37.220',
    },
    {
      name: 'oracle:port',
      description: 'A listener port of the Oracle instance',
      default: nconf.get('oracle:port') || 50439,
    },
    {
      name: 'oracle:database',
      description: 'Oracle database service name',
      default: nconf.get('oracle:database') || 'UDP.PARUS.UA',
    },
    {
      name: 'oracle:schema',
      description: 'UDP schema',
      default: nconf.get('oracle:schema') || 'PARUS',
    },
    {
      name: 'oracle:username',
      description: 'Oracle username',
      default: nconf.get('oracle:username') || 'NODE',
    },
    {
      name: 'oracle:password',
      description: 'Password of Oracle username',
      hidden: true,
      default: nconf.get('oracle:password') || '',
      before: value => value || nconf.get('oracle:password') || ''
    },
    {
      name: 'oracle:oldpkgsess',
      description: 'Old version of PKG_SESSION',
      default: nconf.get('oracle:oldpkgsess') || false,
    }
  ])
  cfg.oracle = {
    host: subConf['oracle:host'],
    port: subConf['oracle:port'],
    database: subConf['oracle:database'],
    schema: subConf['oracle:schema'],
    username: subConf['oracle:username'],
    password: subConf['oracle:password'],
    oldpkgsess: (subConf['oracle:oldpkgsess'] !== 'false') && (subConf['oracle:oldpkgsess'] !== false)
  }

  if (cfg.app.public) {
    subConf = await promptGet([
      {
        name: 'public:username',
        description: 'Username of public user',
        default: nconf.get('public:username') || 'GUEST',
      },
      {
        name: 'public:password',
        description: 'Password of public user',
        hidden: true,
        default: nconf.get('public:password') || '',
        before: value => value || nconf.get('public:password') || ''
      }
    ])
    cfg.public = {
      username: subConf['public:username'],
      password: subConf['public:password']
    }
  }

  if (cfg.app.log) {
    subConf = await promptGet([
      {
        name: 'log:write',
        description: 'Log write interval',
        default: '3s'
      },
      {
        name: 'log:buffer',
        description: 'Log max buffer size (KB)',
        default: 64
      },
      {
        name: 'log:keep',
        description: 'Delete logs older then (days)',
        default: 100
      },
      {
        name: 'log:stdout',
        description: 'Types of log to console out',
        default: ['error', 'debug', 'warning', 'server']
      },
    ])
    cfg.log = {
      write: subConf['log:write'],
      buffer: subConf['log:buffer'],
      keep: subConf['log:keep'],
      stdout: subConf['log:stdout'].split(',')
    }
  }

  fs.writeFileSync(serverConfigPath, JSON.stringify(cfg, null, 4))

  return 0
}

process.stdout.write('\nWelcome to the Web UDP!\n')
process.stdout.write('\nPlease, answer a few questions about your ' +
  'environment before we can proceed.\n')
process.stdout.write('Press enter to accept the default setting (shown in brackets).\n')
doSetup().then(process.exit)
