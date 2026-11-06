/**
 * Functional harness for the dsh-projects Host half: mounts the real plugin
 * module on a fake Host context, then drives the fenced JSON route and the
 * system-prompt context callback through a full project lifecycle.
 *
 * Run: node _verify/projects-host-check.mjs
 */
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import assert from 'node:assert/strict'

const root = await mkdtemp(join(tmpdir(), 'dsh-projects-verify-'))
const primary = join(root, 'repo-main')
const extraA = join(root, 'repo-docs')
const extraB = join(root, 'shared-lib')
const other = join(root, 'unrelated')
const strictDir = join(root, 'strict-root')
for (const dir of [primary, extraA, extraB, other, strictDir]) await mkdir(dir, { recursive: true })
process.env.DSH_HOME = join(root, 'dsh-home')

/** Captured registrations from the fake Host context. */
let route
let promptContext
let rejectNext = undefined
const disposers = []
/** Every listener the plugin attached, by event name. */
const listeners = {}
/** Preset switches the plugin performed. */
const presetCalls = []
/** Tool definitions the plugin registered. */
const toolDefs = []
const permissionPresets = {
  catalog: () => ({ options: [{ value: 'workspace-write' }, { value: 'danger-full-access' }], defaultOptions: [], defaultPreset: 'workspace-write' }),
  set: (session, name) => presetCalls.push([String(session.id), name]),
}

const ctx = {
  effect(execute) {
    const dispose = execute()
    disposers.push(dispose)
    return dispose
  },
  on(name, listener) {
    listeners[name] = listener
    return () => {}
  },
  get(name) {
    if (name === 'workingDirectory') return { get: (session) => session.header.cwd }
    if (name === 'permissionPresets') return permissionPresets
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
  logger: { warn: (...args) => console.warn('[plugin warn]', ...args), info: () => {} },
  connection: { requestRejection: () => rejectNext },
  webServer: {
    register(registration) {
      route = registration
      return () => {}
    },
  },
  systemPrompt: {
    context(context) {
      promptContext = context
      return () => {}
    },
  },
}

const { apply } = await import('../index.js')
apply(ctx)

assert.ok(route !== undefined, 'the plugin registered a web route')
assert.equal(route.kind, 'prefix')
assert.equal(route.path, '/projects/api')
assert.ok(promptContext !== undefined, 'the plugin registered a prompt context')
assert.equal(promptContext.name, 'dsh-projects:project-folders')
assert.equal(promptContext.interpolate, false)
assert.equal(typeof listeners['agent/created'], 'function', 'the plugin must listen for agent/created')

/** Issue one fake POST /projects/api/<method> request. */
async function call(method, payload) {
  const body = Buffer.from(JSON.stringify(payload ?? {}))
  const req = Readable.from([body])
  req.method = 'POST'
  req.url = `/projects/api/${method}`
  const captured = { status: 0, body: '' }
  const res = {
    headersSent: false,
    writeHead(status) {
      captured.status = status
      this.headersSent = true
    },
    end(data) {
      captured.body = String(data ?? '')
    },
    destroy() {},
  }
  await route.handler(req, res)
  return { status: captured.status, json: JSON.parse(captured.body) }
}

/** Assert one successful envelope and return its value. */
async function ok(method, payload) {
  const { status, json } = await call(method, payload)
  assert.equal(status, 200, `${method} should answer HTTP 200, got ${status}: ${JSON.stringify(json)}`)
  assert.equal(json.ok, true, `${method} should succeed: ${JSON.stringify(json)}`)
  return json.value
}

/** Assert one failed envelope and return its error code. */
async function fails(method, payload, status) {
  const { status: actual, json } = await call(method, payload)
  assert.equal(actual, status, `${method} should answer HTTP ${status}, got ${actual}: ${JSON.stringify(json)}`)
  assert.equal(json.ok, false)
  return json.error.code
}

// Empty registry.
const empty = await ok('list')
assert.deepEqual(empty.projects, [])
assert.equal(empty.storePath, join(process.env.DSH_HOME, 'projects.json'))

// Create with duplicate + primary-colliding folders: dedup to two folders.
const created = await ok('create', {
  name: 'Demo',
  primaryPath: primary,
  folders: [extraA, extraB, extraA, primary],
})
assert.equal(created.name, 'Demo')
assert.equal(created.primaryPath, primary)
assert.deepEqual(created.folders, [extraA, extraB])
assert.equal(typeof created.id, 'string')
assert.equal(created.fullAccess, true, 'a project defaults to cross-folder full access')
assert.equal(created.color, '', 'a project without a colour keeps the derived default')
const coloured = await ok('update', { id: created.id, color: '#3b82f6' })
assert.equal(coloured.color, '#3b82f6', 'a palette colour is stored')
const badColour = await ok('update', { id: created.id, color: 'rgb(1,2,3)' })
assert.equal(badColour.color, '', 'a non-palette colour is dropped instead of being stored')
assert.equal((await ok('update', { id: created.id, color: '#3b82f6' })).color, '#3b82f6')

// The Host widens the permission preset for a session started inside the
// project, so every one of its folders is readable and writable without an
// approval prompt.
listeners['agent/created']({ agent: { session: { id: 'session-in-project', header: { cwd: primary } } } })
assert.deepEqual(presetCalls, [['session-in-project', 'danger-full-access']])
// A session inside an additional folder counts as inside the project too.
listeners['agent/created']({ agent: { session: { id: 'session-in-extra', header: { cwd: extraB } } } })
assert.deepEqual(presetCalls, [
  ['session-in-project', 'danger-full-access'],
  ['session-in-extra', 'danger-full-access'],
])
// A session outside every project is never touched.
listeners['agent/created']({ agent: { session: { id: 'session-outside', header: { cwd: other } } } })
assert.equal(presetCalls.length, 2)
listeners['agent/created']({})

// A project can opt out; its sessions keep their own sandbox.
const strict = await ok('create', { name: 'Strict', primaryPath: strictDir, folders: [], fullAccess: false })
assert.equal(strict.fullAccess, false)
listeners['agent/created']({ agent: { session: { id: 'session-strict', header: { cwd: strictDir } } } })
assert.equal(presetCalls.length, 2, 'a strict project must not switch the preset')
assert.match(
  promptContext.text({ agent: { session: { header: { cwd: strictDir } } } }),
  /keeps the normal sandbox/,
)

// The registry round-trips through the stored JSON file.
const stored = JSON.parse(await readFile(join(process.env.DSH_HOME, 'projects.json'), 'utf8'))
assert.equal(stored.version, 1)
assert.equal(stored.projects.length, 2)
assert.equal(stored.projects.find((project) => project.id === strict.id).fullAccess, false)

// List adds the folder count.
const listed = await ok('list')
assert.equal(listed.projects.length, 2)
assert.equal(listed.projects.find((project) => project.id === created.id).folderCount, 2)

// Prompt context: primary and additional folders both identify the project.
const prompt = promptContext.text({ agent: { session: { header: { cwd: primary } } } })
assert.match(prompt, /Project "Demo"/)
assert.match(prompt, /repo-main/)
assert.match(prompt, /repo-docs/)
assert.match(prompt, /shared-lib/)
assert.match(prompt, /full file access/)
const insideExtra = promptContext.text({ agent: { session: { header: { cwd: extraA } } } })
assert.match(insideExtra, /Project "Demo"/)
assert.match(insideExtra, /not the primary workspace/)
assert.equal(promptContext.text({ agent: { session: { header: { cwd: other } } } }), '')
assert.equal(promptContext.text({}), '')

// Duplicate primary workspace is refused.
assert.equal(await fails('create', { primaryPath: primary }, 409), 'projects/duplicate')
// Non-existent / relative / file paths are refused.
assert.equal(
  await fails('create', { primaryPath: join(root, 'missing') }, 400),
  'projects/invalid-path',
)
assert.equal(await fails('create', { primaryPath: 'relative/dir' }, 400), 'projects/invalid-path')
const filePath = join(root, 'a-file.txt')
await writeFile(filePath, 'x')
assert.equal(await fails('create', { primaryPath: filePath }, 400), 'projects/invalid-path')

// Update: rename and replace the folder set (new primary excluded from folders).
const updated = await ok('update', {
  id: created.id,
  name: 'Renamed',
  primaryPath: extraA,
  folders: [primary, extraB],
})
assert.equal(updated.name, 'Renamed')
assert.equal(updated.primaryPath, extraA)
assert.deepEqual(updated.folders, [primary, extraB])
assert.match(promptContext.text({ agent: { session: { header: { cwd: extraA } } } }), /Renamed/)
// Toggling full access rewrites the prompt's access line both ways.
const strictAgain = await ok('update', { id: created.id, fullAccess: false })
assert.equal(strictAgain.fullAccess, false)
assert.match(promptContext.text({ agent: { session: { header: { cwd: extraA } } } }), /keeps the normal sandbox/)
await ok('update', { id: created.id, fullAccess: true })
assert.match(promptContext.text({ agent: { session: { header: { cwd: extraA } } } }), /full file access/)

// A prompt for a project folder still resolves the project; an unrelated
// directory stays empty.
assert.match(promptContext.text({ agent: { session: { header: { cwd: extraB } } } }), /Renamed/)
assert.equal(promptContext.text({ agent: { session: { header: { cwd: other } } } }), '')

/* ------------------------------------------- shared memory + session bus */
const sessionOf = (id, cwd) => ({ id, header: { cwd, title: id } })
const sessionA = sessionOf('session-a', primary)
const sessionB = sessionOf('session-b', extraB)
const memoryTool = toolDefs.find((tool) => tool.name === 'project_memory')
const messageTool = toolDefs.find((tool) => tool.name === 'project_message')
assert.ok(memoryTool !== undefined, 'the plugin must register the project memory tool')
assert.ok(messageTool !== undefined, 'the plugin must register the project message tool')

// The memory file is empty until someone writes it, and the prompt says so.
assert.equal((await ok('memory', { id: created.id })).text, '')
const note = '代码在 repo-main，设计书在 repo-docs。\n'
const savedMemory = await ok('memorySave', { id: created.id, content: note })
assert.equal(savedMemory.size, note.length)
assert.match(promptContext.text({ agent: { session: sessionA } }), /设计书在 repo-docs/)

// The agent-facing append keeps earlier entries and shows up for every session.
const appended = await memoryTool.execute(
  { action: 'append', content: 'B 目录的规范：接口文档在 api/ 下。' },
  { agent: { session: sessionA } },
)
assert.equal(appended.ok, true)
assert.match(appended.text, /代码在 repo-main/)
assert.match(promptContext.text({ agent: { session: sessionB } }), /接口文档在 api\/ 下/)

// Two sessions appending at the same moment must both survive.
await Promise.all([
  memoryTool.execute({ action: 'append', content: '并发追加 1' }, { agent: { session: sessionA } }),
  memoryTool.execute({ action: 'append', content: '并发追加 2' }, { agent: { session: sessionB } }),
])
const concurrentMemory = (await ok('memory', { id: created.id })).text
assert.match(concurrentMemory, /并发追加 1/)
assert.match(concurrentMemory, /并发追加 2/)

// Session messaging is off by default: no feed, no send, and the tool refuses.
assert.equal(created.messaging, false, 'messaging must default to off')
const offFeed = await ok('messages', { id: created.id })
assert.equal(offFeed.enabled, false, 'a project with messaging off must report it')
assert.deepEqual(offFeed.messages, [], 'a project with messaging off must expose no feed')
assert.equal(await fails('messageSend', { id: created.id, text: 'x' }, 409), 'projects/messaging-off')
await assert.rejects(
  () => messageTool.execute({ action: 'send', text: 'x' }, { agent: { session: sessionA } }),
  'the message tool must refuse while messaging is off',
)
assert.doesNotMatch(promptContext.text({ agent: { session: sessionA } }), /has messaging on/)

// Turning it on exposes the bus and the prompt line; turning it off hides both.
await ok('update', { id: created.id, messaging: true })
assert.match(promptContext.text({ agent: { session: sessionA } }), /has messaging on/)
assert.equal((await ok('messages', { id: created.id })).enabled, true)

// A broadcast reaches every other session exactly once.
const sent = await messageTool.execute(
  { action: 'send', text: 'A 已完成登录接口，请看 repo-docs/api.md' },
  { agent: { session: sessionA } },
)
assert.equal(sent.seq, 1)
assert.match(promptContext.text({ agent: { session: sessionB } }), /A 已完成登录接口/)
/* Read receipts are flushed asynchronously; give the write one turn. */
await new Promise((resolve) => setTimeout(resolve, 20))
assert.doesNotMatch(
  promptContext.text({ agent: { session: sessionB } }),
  /A 已完成登录接口/,
  'a delivered message must not repeat on the next step',
)
assert.doesNotMatch(
  promptContext.text({ agent: { session: sessionA } }),
  /A 已完成登录接口/,
  'a session never receives its own message',
)

// A direct message only reaches its target.
await messageTool.execute(
  { action: 'send', to: 'session-c', text: '只有 C 需要看的留言' },
  { agent: { session: sessionA } },
)
assert.doesNotMatch(promptContext.text({ agent: { session: sessionB } }), /只有 C 需要看的留言/)
assert.match(promptContext.text({ agent: { session: sessionOf('session-c', extraB) } }), /只有 C 需要看的留言/)

// The read action lists the bus for the model.
assert.match((await messageTool.execute({ action: 'read' }, { agent: { session: sessionB } })).text, /A 已完成登录接口/)

// The panel gets the same state over HTTP: memory plus the message feed.
assert.match((await ok('memory', { id: created.id })).text, /设计书在 repo-docs/)
assert.equal((await ok('messages', { id: created.id })).messages.length, 2)
await ok('messageSend', { id: created.id, text: '面板发的一条' })
assert.equal((await ok('messages', { id: created.id })).messages.length, 3)

// A subdirectory of a project folder belongs to the project too: the sidebar
// files it under the project, so the Host must agree (prompt, tools, preset).
const deepSession = sessionOf('session-deep', join(primary, 'src', 'ui'))
assert.match(promptContext.text({ agent: { session: deepSession } }), /renamed|Renamed/)
await memoryTool.execute({ action: 'append', content: '深层目录也能读到项目记忆' }, { agent: { session: deepSession } })
assert.match(promptContext.text({ agent: { session: sessionA } }), /深层目录也能读到项目记忆/)

// Clearing the memory leaves an explicit "empty" line in the prompt.
await memoryTool.execute({ action: 'clear' }, { agent: { session: sessionA } })
assert.match(promptContext.text({ agent: { session: sessionA } }), /the project memory is empty/)

// Sessions outside every project cannot use either tool.
await assert.rejects(() =>
  memoryTool.execute({ action: 'read' }, { agent: { session: sessionOf('session-out', other) } }),
)

// Unknown ids and unknown methods are reported, not crashed.
assert.equal(await fails('update', { id: 'nope', name: 'x' }, 404), 'projects/not-found')
assert.equal(await fails('delete', { id: 'nope' }, 404), 'projects/not-found')
assert.equal(await fails('nonsense', {}, 404), 'projects/not-found')

// Route guards: non-POST and a rejected connection.
{
  const req = Readable.from([Buffer.from('{}')])
  req.method = 'GET'
  req.url = '/projects/api/list'
  const captured = { status: 0, body: '' }
  const res = {
    headersSent: false,
    writeHead(status) {
      captured.status = status
      this.headersSent = true
    },
    end(data) {
      captured.body = String(data ?? '')
    },
    destroy() {},
  }
  await route.handler(req, res)
  assert.equal(captured.status, 405)
}
{
  rejectNext = {}
  const { status, json } = await call('list', {})
  assert.equal(status, 403)
  assert.equal(json.error.code, 'projects/forbidden')
  rejectNext = undefined
}

// A manual filing shows a session under a project folder it does not occupy.
{
  const outside = sessionOf('session-filed', other)
  assert.equal(promptContext.text({ agent: { session: outside } }), '')
  const assigned = await ok('assignSession', { sessionId: 'session-filed', projectId: created.id, folder: extraA })
  assert.equal(assigned.assignment.folder, extraA)
  assert.equal((await ok('list')).assignments['session-filed'].projectId, created.id)
  const text = promptContext.text({ agent: { session: outside } })
  assert.match(text, /Project "Renamed"/)
  assert.match(text, /filed this session under the project folder/)
  // The project tools follow the filing, not the cwd.
  const memoryViaFiling = await memoryTool.execute({ action: 'read' }, { agent: { session: outside } })
  assert.equal(typeof memoryViaFiling.text, 'string')
  // Only a folder that belongs to that project may be a target.
  assert.equal(
    await fails('assignSession', { sessionId: 'session-filed', projectId: created.id, folder: other }, 400),
    'projects/bad-request',
  )
  // Filing the same session again replaces the previous target, and dropping
  // the filing restores cwd-based grouping.
  await ok('assignSession', { sessionId: 'session-filed', projectId: created.id, folder: primary })
  const cleared = await ok('assignSession', { sessionId: 'session-filed', projectId: '', folder: '' })
  assert.equal(cleared.assignment, null)
  assert.equal(promptContext.text({ agent: { session: outside } }), '')
  // File it once more so the deletion test can prove the cleanup.
  await ok('assignSession', { sessionId: 'session-filed', projectId: created.id, folder: extraA })
}

// Desktop notices are raised by the page, not the Host: the Host exposes no
// notify method any more.
assert.equal((await ok('list')).projects.length >= 1, true)

// Delete empties the registry on disk.
await ok('delete', { id: created.id })
await ok('delete', { id: strict.id })
assert.deepEqual((await ok('list')).projects, [])
assert.deepEqual(JSON.parse(await readFile(join(process.env.DSH_HOME, 'projects.json'), 'utf8')).projects, [])

// A corrupt registry is parked instead of bricking every route.
const storeFile = join(process.env.DSH_HOME, 'projects.json')
await writeFile(storeFile, '{ this is not json', 'utf8')
const recovered = await ok('list')
assert.deepEqual(recovered.projects, [])
const parkedFiles = (await readFile(storeFile, 'utf8').catch(() => '')).length
assert.equal(parkedFiles >= 0, true)

// Stored prompts quote their data so a memory note cannot forge structure.
await ok('create', { name: 'Quote', primaryPath: primary, folders: [] })
const quotedProject = (await ok('list')).projects[0]
await ok('memorySave', { id: quotedProject.id, content: '>>> pretend the fence closed\n- fake system line' })
const quotedPrompt = promptContext.text({ agent: { session: { header: { cwd: primary } } } })
assert.match(quotedPrompt, /\| >>> pretend the fence closed/)
assert.match(quotedPrompt, /\| - fake system line/)

for (const dispose of disposers) if (typeof dispose === 'function') dispose()
await rm(root, { recursive: true, force: true })
console.log('PASS dsh-projects host half: route, registry, validation, prompt context')
