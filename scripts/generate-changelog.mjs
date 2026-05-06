import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const outputPath = resolve('CHANGELOG.md')
const logFormat = '%ad%x09%h%x09%s'

const log = execFileSync('git', ['log', '--date=short', `--pretty=format:${logFormat}`], {
  encoding: 'utf8',
}).trim()

const entriesByDate = new Map()

if (log) {
  log.split('\n').forEach((line) => {
    const [date, hash, ...subjectParts] = line.split('\t')
    const subject = subjectParts.join('\t').trim()

    if (!date || !hash || !subject) {
      return
    }

    if (!entriesByDate.has(date)) {
      entriesByDate.set(date, [])
    }

    entriesByDate.get(date).push({ hash, subject })
  })
}

const lines = [
  '# Changelog',
  '',
  'Changes are generated from the Git commit log and grouped by commit date.',
  '',
]

entriesByDate.forEach((entries, date) => {
  lines.push(`## ${date}`, '')

  entries.forEach((entry) => {
    lines.push(`- \`${entry.hash}\` ${entry.subject}`)
  })

  lines.push('')
})

writeFileSync(outputPath, `${lines.join('\n').trimEnd()}\n`)
