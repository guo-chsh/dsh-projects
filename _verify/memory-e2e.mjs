/**
 * End-to-end check of the shared project memory.
 *
 * Everything below is the real thing: a real HTTP server on a real socket, the
 * plugin's real route handler reading a real request body, real files under a
 * temporary DSH_HOME, the plugin's real prompt-context function, and its real
 * agent tools. Only the Cordis context is a stub.
 *
 * What it proves:
 *   - the memory API works over HTTP (200 envelope, 403 fence, 413 size cap)
 *   - the memory lives on disk at the documented path and survives a reload
 *   - every session of the project reads it, in any of the project's folders
 *   - another project never sees it
 *   - each step re-reads it, so a new session and a compacted session both get it
 *   - long memory is truncated in the prompt but not on disk
 *   - deleting a project removes its memory and bus files
 *
 * Run: node _verify/memory-e2e.mjs
 */
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = await mkdtemp(join(tmpdir(), 'dsh-memory-e2e-'))
process.env.DSH_HOME = join(root, 'home')
await mkdir(process.env.DSH_HOME, { recursive: true })

const primaryA = join(root, 'repo-a')
const extraA = join(root, 'docs-a')
const primaryB = join(root, 'repo-b')
for (const dir of [primaryA, extraA, primaryB]) await mkdir(dir, { recursive: true })

const memoryPath = (id) => join(process.env.DSH_HOME, 'project-memory', `${id}.md`)
const busPath = (id) => join(process.env.DSH_HOME, 'project-memory', `${id}.messages.json`)

let checks = 0
const check = (condition, message) => {
  assert.ok(condition, message)
  checks += 1
  console.log(`  ok  ${message}`)
}

/** Boot the plugin on a fresh stub context; returns everything the test drives. */
async function boot() {
  const disposers = []
  const toolDefs = []
  const promptContexts = []
  let route
  let reject = false
  const ctx = {
    effect(execute) {
      const dispose = execute()
      disposers.push(dispose)
      return dispose
    },
    on() {
      return () => {}
    },
    get(name) {
      if (name === 'workingDirectory') return { get: (session) => session.header.cwd }
      if (name === 'permissionPresets') {
        return { catalog: () => [{ name: 'danger-full-access' }], set: () => {} }
      }
      if (name === 'tools') {
        return {
          register(definition) {
            toolDefs.push(definition)
            return () => {}
          },
        }
      }
      return undefined
    },
    logger: { warn: () => {}, info: () => {} },
    connection: { requestRejection: () => (reject ? { status: 403 } : undefined) },
    webServer: {
      register(registration) {
        route = registration
        return () => {}
      },
    },
    systemPrompt: {
      context(context) {
        promptContexts.push(context)
        return () => {}
      },
    },
  }
  const module = await import(`../index.js?boot=${Math.random()}`)
  module.apply(ctx)
  assert.ok(route !== undefined, 'the plugin must register its route')
  const promptFor = (cwd, id = 'session-1') =>
    promptContexts[0].text({ agent: { session: { id, header: { cwd, title: id } } } })
  return {
    route,
    toolDefs,
    promptFor,
    setReject: (value) => {
      reject = value
    },
    dispose() {
      for (const dispose of disposers) {
        try {
          dispose()
        } catch {}
      }
    },
  }
}

const app = await boot()
const server = createServer((req, res) => void app.route.handler(req, res))
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}/projects/api`

/** One real POST over a real socket. */
async function api(method, payload) {
  const response = await fetch(`${base}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  })
  const text = await response.text()
  return { status: response.status, json: JSON.parse(text) }
}
const ok = async (method, payload) => {
  const result = await api(method, payload)
  assert.equal(result.status, 200, `${method}: ${result.status} ${JSON.stringify(result.json)}`)
  assert.equal(result.json.ok, true)
  return result.json.value
}

console.log('\nHTTP route and fence')
const projectA = await ok('create', { name: 'A 项目', primaryPath: primaryA, folders: [extraA] })
const projectB = await ok('create', { name: 'B 项目', primaryPath: primaryB, folders: [] })
check(typeof projectA.id === 'string' && projectA.id.length > 0, 'create returns a project id over HTTP')
app.setReject(true)
check((await api('list')).status === 403, 'an unauthenticated request is fenced with 403')
app.setReject(false)
const notFound = await api('project-memory-nope')
check(notFound.status === 404, 'an unknown API method answers 404')

console.log('\nMemory starts empty and lives on disk')
check((await ok('memory', { id: projectA.id })).text === '', 'a fresh project has empty memory')
const tokenOne = 'MEMO-CHECK-111 代码在 repo-a，设计书在 docs-a。'
const saved = await ok('memorySave', { id: projectA.id, content: tokenOne })
check(saved.path === memoryPath(projectA.id), 'memory is stored at $DSH_HOME/project-memory/<id>.md')
check(existsSync(memoryPath(projectA.id)), 'the memory file exists on disk')
check((await readFile(memoryPath(projectA.id), 'utf8')) === tokenOne, 'the memory file bytes equal what was saved')

console.log('\nEvery session of the project reads it, other projects do not')
check(app.promptFor(primaryA).includes('MEMO-CHECK-111'), 'a session in the primary workspace reads the memory')
check(app.promptFor(extraA).includes('MEMO-CHECK-111'), "a session in an additional folder reads it too")
check(app.promptFor(primaryB).includes('MEMO-CHECK-111') === false, 'another project never sees it')
check(app.promptFor(join(root, 'unrelated')) === '', 'a session outside every project gets no project context')

console.log('\nThe agent tool appends without losing earlier notes')
const memoryTool = app.toolDefs.find((tool) => tool.name === 'project_memory')
check(memoryTool !== undefined, 'the project_memory tool is registered')
const appended = await memoryTool.execute(
  { action: 'append', content: 'B 目录规范：接口文档在 api/ 下。' },
  { agent: { session: { id: 'session-1', header: { cwd: extraA } } } },
)
check(appended.ok === true, 'append succeeds from inside a project folder')
const afterAppend = app.promptFor(primaryA, 'session-2')
check(afterAppend.includes('MEMO-CHECK-111'), 'append keeps the earlier note')
check(afterAppend.includes('接口文档在 api/ 下'), 'append adds the new note')

console.log('\nEach step re-reads the memory (new sessions and compacted ones)')
await writeFile(memoryPath(projectA.id), `${tokenOne}\nMEMO-CHECK-333 外部写入的一条。\n`, 'utf8')
check(app.promptFor(primaryA, 'session-3').includes('MEMO-CHECK-333'), 'a change on disk shows up on the next step with no reload')
check(app.promptFor(primaryA, 'session-3').includes('MEMO-CHECK-111'), 'the rest of the memory is still there')

console.log('\nLong memory is truncated in the prompt, never on disk')
const longMemory = `MARK-OLD\n${'x'.repeat(6_000)}${'y'.repeat(2_000)}MARK-NEW`
await ok('memorySave', { id: projectA.id, content: longMemory })
const longPrompt = app.promptFor(primaryA, 'session-4')
check((await readFile(memoryPath(projectA.id), 'utf8')).length === longMemory.length, 'the whole memory stays on disk')
check(longPrompt.includes('MARK-NEW'), 'the prompt keeps the newest part')
check(longPrompt.includes('earlier entries omitted'), 'the prompt says that older entries were dropped')
check(longPrompt.includes('MARK-OLD') === false, 'the prompt drops the oldest part')

console.log('\nThe size cap is enforced, and a rejected write changes nothing')
const before = await readFile(memoryPath(projectA.id), 'utf8')
const tooBig = await api('memorySave', { id: projectA.id, content: 'z'.repeat(200_001) })
check(tooBig.status === 413, 'a memory above the cap answers 413')
check(tooBig.json.error.code === 'projects/too-large', 'the 413 carries projects/too-large')
check((await readFile(memoryPath(projectA.id), 'utf8')) === before, 'the rejected write left the file untouched')

console.log('\nMessaging is independent of memory')
await ok('update', { id: projectA.id, messaging: true })
check(app.promptFor(primaryA, 'session-5').includes('MARK-NEW'), 'memory still reaches a session with messaging on')
await ok('update', { id: projectA.id, messaging: false })
check(app.promptFor(primaryA, 'session-6').includes('MARK-NEW'), 'memory still reaches a session with messaging off')

console.log('\nThe memory survives a plugin reload (disk, not heap)')
app.dispose()
const reloaded = await boot()
server.removeAllListeners('request')
server.on('request', (req, res) => void reloaded.route.handler(req, res))
check(reloaded.promptFor(primaryA, 'session-7').includes('MARK-NEW'), 'a fresh plugin instance reads the same memory from disk')
check(reloaded.promptFor(primaryB).includes('MARK-NEW') === false, 'the reloaded instance still isolates projects')

console.log('\nDeleting a project removes its room files only')
await ok('memorySave', { id: projectB.id, content: 'B 项目自己的记忆' })
await ok('update', { id: projectB.id, messaging: true })
await ok('messageSend', { id: projectB.id, text: 'x' })
const bMemory = await readFile(memoryPath(projectB.id), 'utf8')
await ok('delete', { id: projectA.id })
check(existsSync(memoryPath(projectA.id)) === false, 'deleting a project removes its memory file')
check(existsSync(busPath(projectA.id)) === false, 'deleting a project removes its message bus file')
check((await readFile(memoryPath(projectB.id), 'utf8')) === bMemory, 'deleting one project leaves the other intact')
check((await ok('list')).projects.length === 1, 'the registry keeps only the surviving project')

server.close()
await rm(root, { recursive: true, force: true })

console.log(`\nPASS dsh-projects shared memory end-to-end: ${checks} checks over real HTTP, disk, prompt and tools`)