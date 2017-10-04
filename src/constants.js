'use strict'

const c = module.exports
const escapeRegExp = s => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
c.DIR = process.cwd()
c.isWin = !!process.platform.match(/^win/)
c.SEMICOLON_REGEXP = /;/g
c.PATH_SEPARATOR = process.isWin ? '\\' : '/'
c.STACK_REGEXP = [
  [new RegExp(escapeRegExp(c.DIR + c.PATH_SEPARATOR + 'node_modules'), 'g'), ''],
  [new RegExp(escapeRegExp(c.DIR), 'g'), ''],
  [/\n\s{4,}at/g, ';'],
  [/\n/g, ';'],
  [/[\t^]/g, ' '],
  [/\s{2,}/g, ' '],
  [/;\s;/g, ';']
]
