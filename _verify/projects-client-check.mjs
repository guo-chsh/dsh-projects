/**
 * Functional check of the dsh-projects Client half without a browser:
 * loads client.js through a fake module loader, runs `apply` against a fake
 * slot/locale/workspace context, then executes the registered components with
 * stub React hooks and asserts the project tree, folder chips and badge text.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(here, '..', 'client.js'), 'utf8')

/* ---------------------------------------------------------------- fake React */
class Component {
  constructor(props) {
    this.props = props
    this.state = {}
  }
}
/* Hooks keep their values per component function, so a simulated click can be
 * followed by another pass that sees the new state (React-like identity). */
let currentOwner = null
let hookCursor = 0
const hookStore = new Map()
const effectStore = new Map()
/** Run one function component with its own hook slots. */
function callComponent(type, props) {
  const previousOwner = currentOwner
  currentOwner = type
  hookCursor = 0
  try {
    return type(props)
  } finally {
    currentOwner = previousOwner
  }
}
const React = {
  Component,
  Fragment: Symbol('Fragment'),
  createElement(type, props, ...children) {
    return { type, props: { ...(props ?? {}), children: children.length === 1 ? children[0] : children } }
  },
  useState(initial) {
    if (!hookStore.has(currentOwner)) hookStore.set(currentOwner, [])
    const slots = hookStore.get(currentOwner)
    const index = hookCursor
    hookCursor += 1
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
    const set = (next) => {
      const value = typeof next === 'function' ? next(slots[index]) : next
      slots[index] = value
    }
    return [slots[index], set]
  },
  useEffect(fn, deps) {
    const owner = currentOwner
    const index = hookCursor
    hookCursor += 1
    if (!effectStore.has(owner)) effectStore.set(owner, [])
    const slots = effectStore.get(owner)
    const previous = slots[index]
    const changed =
      previous === undefined ||
      deps === undefined ||
      previous.deps === undefined ||
      deps.length !== previous.deps.length ||
      deps.some((value, at) => Object.is(value, previous.deps[at]) === false)
    if (changed === false) return
    slots[index] = { deps }
    fn()
  },
  useMemo: (factory) => factory(),
  useCallback: (fn) => fn,
}

/* ------------------------------------------------------------- element tools */
function render(node) {
  if (node === null || node === undefined || node === false) return []
  if (Array.isArray(node)) return node.flatMap(render)
  if (typeof node === 'string' || typeof node === 'number') return [String(node)]
  const type = node.type
  if (typeof type === 'function') {
    if (type.prototype instanceof Component) {
      const instance = new type(node.props)
      return render(instance.render())
    }
    return render(callComponent(type, node.props))
  }
  return render(node.props?.children)
}
const text = (node) => render(node).join('|')

/* ------------------------------------------------------- module + fake context */
let definition
/** Window listeners the plugin registers (focus clears pending notices). */
const windowListeners = new Map()
globalThis.window = {
  __ModuleLoader__: { load: (value) => { definition = value } },
  addEventListener: (name, handler) => windowListeners.set(name, handler),
  removeEventListener: (name) => windowListeners.delete(name),
  focus: () => {},
}
try {
  globalThis.navigator = { platform: 'Win32', userAgent: 'node' }
} catch {}

/* The Client half asks the Host for `list` at apply time to learn whether the
 * sidebar takeover is enabled; stub the one route call it makes. */
const listed = {
  ok: true,
  value: {
    storePath: 'C:/home/projects.json',
    settings: { sidebarTakeover: true },
    projects: [
      { id: 'p1', name: 'A项目', primaryPath: 'C:/work/A', folders: ['C:/work/A/sub', 'C:/work/A-extra'], updatedAt: '' },
      { id: 'p2', name: 'B项目', primaryPath: 'C:/work/B', folders: [], updatedAt: '' },
    ],
  },
}
let listCalls = 0
/** Mutated by the desktop-notice tests: true means the window is in front. */
let windowFocused = false
/** Every desktop notice the plugin asks the OS to show. */
const desktopNotices = []
globalThis.document = {
  baseURI: 'http://dsh.test/',
  addEventListener: () => {},
  removeEventListener: () => {},
  hasFocus: () => windowFocused,
  visibilityState: 'visible',
}
globalThis.Notification = class FakeNotification {
  static permission = 'granted'
  static requestPermission = async () => 'granted'
  constructor(title, options) {
    this.title = title
    this.options = options ?? {}
    this.closed = false
    desktopNotices.push(this)
  }
  close() {
    this.closed = true
  }
}
globalThis.fetch = async () => {
  listCalls += 1
  return { status: 200, json: async () => listed }
}
new Function('window', source)(globalThis.window)

const plugin = definition.factory((name) => {
  if (name === 'react') return React
  throw new Error(`unexpected require: ${name}`)
})

const registrations = []
const effects = []
const ctx = {
  effect: (factory) => {
    const disposer = factory()
    effects.push(disposer)
    return typeof disposer === 'function' ? disposer : () => {}
  },
  locale: { register: () => () => {}, bind: () => (key) => key },
  slots: {
    inject: (_name, callback) => {
      callback()
      return () => {}
    },
    register: (options, component) => {
      registrations.push({ options, component })
      return () => {}
    },
  },
  layout: { selectPanel: (id) => registrations.push({ selected: id }) },
  workspaces: { create: async ({ path }) => ({ workspaceId: `ws:${path}` }) },
  uiWorkspace: {
    pickDirectory: async () => 'C:/picked',
    startSession: (id) => registrations.push({ started: id }),
    openSession: (id) => registrations.push({ opened: id }),
  },
}

plugin.apply(ctx)
/* The sidebar takeover registers after the Host says it is enabled. */
await new Promise((resolve) => setTimeout(resolve, 20))

/* --------------------------------------------------------------- fixture data */
const projects = [
  { id: 'p1', name: 'A项目', primaryPath: 'C:/work/A', folders: ['C:/work/A/sub', 'C:/work/A-extra'], updatedAt: '' },
  { id: 'p2', name: 'B项目', primaryPath: 'C:/work/B', folders: [], updatedAt: '' },
]
const rows = {
  s1: { id: 's1', cwd: 'C:/work/A', displayTitle: 'A项目会话1', updatedAt: 3000, retainedBy: { mainView: 1 } },
  s2: { id: 's2', cwd: 'C:/work/A/sub/deep', displayTitle: 'sub会话', updatedAt: 2000, retainedBy: {} },
  s3: { id: 's3', cwd: 'C:/work/A-extra', displayTitle: 'extra会话', updatedAt: 1800, retainedBy: {} },
  s4: { id: 's4', cwd: 'C:/work/Elsewhere', displayTitle: '外部会话', updatedAt: 1000, retainedBy: {} },
  s5: { id: 's5', cwd: 'C:/work/B', displayTitle: 'B会话', updatedAt: 900, retainedBy: {} },
  s6: { id: 's6', cwd: 'C:/work/A', displayTitle: '空白草稿', updatedAt: 800, blank: true, retainedBy: {} },
  s7: { id: 's7', cwd: 'C:/work/A', displayTitle: '子代理', updatedAt: 700, origin: 'subagent', retainedBy: {} },
  s8: { id: 's8', cwd: 'C:/work/A', displayTitle: 'A项目会话2', updatedAt: 2500, retainedBy: {} },
  s9: { id: 's9', cwd: 'C:/loose/one', displayTitle: '游离会话', updatedAt: 600, retainedBy: {} },
  s10: { id: 's10', cwd: 'C:/loose/two', displayTitle: '游离会话2', updatedAt: 500, retainedBy: {} },
}
const sessions = { ids: Object.keys(rows), byId: rows }
const workspaces = {
  items: [{ workspaceId: 'w1', path: 'C:/work/Elsewhere', title: 'Elsewhere', sessionIds: ['s4'] }],
  archivedSessionIds: [],
  pinnedSessionIds: ['s1', 's9'],
  phase: 'ready',
}
const store = (() => {
  const snapshot = { status: 'ready', projects, error: null }
  return {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
    refresh: () => Promise.resolve(),
  }
})()
/* One project opts out of cross-folder full access. */
projects[1].fullAccess = false
/* One project keeps session messaging on; the other keeps the default (off). */
projects[0].messaging = true

const hooks = (selector) => selector(sessions)
const workspaceHooks = (selector) => selector(workspaces)
/** Live per-session UI status: running, waiting on the user, done-unread. */
const statusMap = new Map([
  ['s1', { running: true }],
  ['s3', { pendingInteraction: { kind: 'approval' } }],
  ['s5', { completionUnread: true }],
])
/** The shipped hook hands out a fresh snapshot on every status change. */
/**
 * The shipped hook consumes one hook slot internally; the stub does the same so
 * a component that falls back to its own default hook keeps a stable hook count
 * exactly like the real renderer would.
 */
const statusHooks = (selector) => {
  React.useState(null)
  return selector(new Map(statusMap))
}

const browserRegistration = registrations.find((entry) => entry.options.name === 'sidebar.workspaces')
const badgeRegistration = registrations.find((entry) => entry.options.id === 'project-folders')

let browser = null
/** Render the browsing region once (hook slots are keyed by component). */
const renderBrowser = (props) => {
  browser = callComponent(browserRegistration.component, props)
  return browser
}
/** Host bridge calls the browsing region makes (notify on a finished reply). */
const browserCalls = []
const browserProps = {
  t: (key) => key,
  wide: true,
  expandSidebar: () => {},
  useSessions: hooks,
  useWorkspaces: workspaceHooks,
  useSessionStatus: statusHooks,
  store,
  start: () => {},
  manage: () => {},
  open: () => {},
  call: async (method, payload) => {
    browserCalls.push({ method, payload })
    if (method === 'notify') return { shown: false }
    return {}
  },
}
renderBrowser(browserProps)
const flat = text(browser)

/* ------------------------------------------------- structural tree utilities */
function walkNodes(node, visit) {
  if (node === null || node === undefined || node === false) return
  if (Array.isArray(node)) {
    for (const child of node) walkNodes(child, visit)
    return
  }
  if (typeof node !== 'object') return
  visit(node)
  const type = node.type
  if (typeof type === 'function') {
    if (type.prototype instanceof Component) {
      walkNodes(new type(node.props).render(), visit)
      return
    }
    walkNodes(callComponent(type, node.props), visit)
    return
  }
  walkNodes(node.props?.children, visit)
}
function walk(node, visit) {
  walkNodes(node, visit)
}
let nodes = []
const collect = (tree) => {
  nodes = []
  walk(tree, (node) => nodes.push(node))
  return nodes
}
collect(browser)
const rowOf = (sessionId) => nodes.find((node) => node.props?.['data-session-id'] === sessionId)
const findIn = (node, predicate) => {
  let found = null
  walk(node, (candidate) => {
    if (found === null && predicate(candidate) === true) found = candidate
  })
  return found
}
const markOf = (sessionId) => findIn(rowOf(sessionId), (node) => node.props?.['data-mark'] !== undefined)
const styleOf = (node) => node?.props?.style ?? {}

/* --------------------------------------------------------------- assertions */
const failures = []
const expect = (condition, message) => {
  if (!condition) failures.push(message)
}
const order = (needle) => flat.indexOf(needle)

expect(plugin.inject.includes('layout'), 'client inject must declare layout')
expect(browserRegistration !== undefined, 'sidebar.workspaces registration missing')
expect(browserRegistration.options.priority === -100, 'sidebar.workspaces must shadow at priority -100')
expect(registrations.some((entry) => entry.options.id === 'projects' && entry.options.name === 'sidebar.panellist'),
  'sidebar.panellist entry missing')
expect(registrations.some((entry) => entry.options.key === 'projects' && entry.options.name === 'main'),
  'main panel entry missing')
expect(badgeRegistration !== undefined, 'session header action missing')
expect(badgeRegistration.options.order === 30, 'session header action order')

expect(order('A项目') !== -1, 'project A group missing')
expect(order('B项目') !== -1, 'project B group missing')
expect(order('A项目会话1') !== -1, 'primary session missing from project A')
expect(order('sub会话') !== -1, 'additional-folder session missing from project A')
expect(order('extra会话') !== -1, 'second additional folder session missing')
expect(order('B会话') !== -1, 'project B session missing')
expect(order('A项目') < order('A项目会话2'), 'project A must precede its unpinned sessions')
expect(order('A项目会话1') < order('sub会话'), 'sessions must sort by recency')
expect(order('其他会话') === -1 || order('外部会话') > order('其他会话'), 'unmatched session must trail the projects')
expect(flat.includes('A-extra'), 'non-primary folder chip missing')
expect(flat.includes('sidePrimaryShort'), 'primary folder chip missing')
expect(flat.includes('空白草稿') === false, 'inactive blank session must stay hidden')
expect(flat.includes('子代理') === false, 'subagent session must stay hidden')

/* ------------------------------------------------------------ row visuals */
const runningRow = rowOf('s1')
const runningMark = markOf('s1')
expect(runningMark?.props?.['data-mark'] === 'running', 'running session must use the ongoing mark')
const runningSpinner = findIn(runningMark, (node) => node.props?.['data-spinner'] === 'running')
expect(runningSpinner !== null, 'the ongoing mark must be a loading spinner')
expect(String(styleOf(runningSpinner).animation ?? '').includes('dsh-projects-spin'),
  'the loading spinner must rotate')
expect(String(styleOf(runningSpinner).borderTopColor ?? '').includes('brand-primary'),
  'the loading spinner must tint its arc with the brand colour')
expect(findIn(runningMark, (node) => String(styleOf(node).animation ?? '').includes('dsh-projects-pulse')) === null,
  'the ongoing mark must not use the breathing animation')
expect(flat.includes('sideRunning'), 'running row must label its live state')

const pendingMark = markOf('s3')
expect(pendingMark?.props?.['data-mark'] === 'pending', 'session waiting on the user must use the warning dot')
expect(findIn(pendingMark, (node) => String(styleOf(node).background ?? '').includes('state-warn-primary')) !== null,
  'the warning dot must use the warn colour')

const doneMark = markOf('s5')
expect(doneMark?.props?.['data-mark'] === 'done', 'finished-unread session must use the done dot')
expect(findIn(doneMark, (node) => String(styleOf(node).background ?? '').includes('state-success-primary')) !== null,
  'the done dot must use the success colour')
expect(findIn(doneMark, (node) => node.type === 'svg') === null,
  'the shipped state-dot set draws no check glyph')

const readMark = markOf('s2')
expect(readMark?.props?.['data-mark'] === 'idle', 'a settled, read session must fall back to the idle dot')
expect(findIn(readMark, (node) => String(styleOf(node).background ?? '').includes('state-idle-primary')) !== null,
  'the idle dot must use the idle colour')

/* No mark may carry a letter of the session title any more. */
const markNodes = nodes.filter((node) => node.props?.['data-mark'] !== undefined)
expect(markNodes.length >= 5, 'every visible session row must render a state mark')
for (const node of markNodes) {
  expect(/[A-Za-z\u4e00-\u9fff]/.test(text(node)) === false, `mark must not carry a title letter (${text(node)})`)
  expect(styleOf(node).width === 16 && styleOf(node).height === 16, 'the mark must be the shipped 16px cell')
}

/* Folder placement is carried by the folder sections, not by a row chip. */
const sectionHeadOf = (title) =>
  nodes.find((node) => node.type === 'button' && node.props?.title === title && styleOf(node).fontSize === 13)
const primarySection = sectionHeadOf('C:/work/A')
expect(primarySection !== undefined, 'the primary workspace must become its own section head')
expect(text(primarySection).includes('sidePrimaryShort'), 'the primary section must read as the primary workspace')
const subSection = sectionHeadOf('C:/work/A/sub')
expect(subSection !== undefined, 'an additional folder must become its own section head')
expect(findIn(subSection, (node) => node.type === 'svg') !== null, 'an additional folder head must carry the folder glyph')
expect(text(subSection).includes('sub'), 'an additional folder head must name the folder')
expect(findIn(rowOf('s8'), (node) => typeof node.props?.title === 'string' && /sidePrimaryHint|sideSubHint/.test(node.props.title)) === null,
  'session rows must no longer carry a folder chip')
const pinnedHead = nodes.find((node) => node.props?.['data-static-section'] === 'true' && text(node).includes('sidePinned'))
expect(pinnedHead !== undefined, 'a pinned section must head the whole tree')
expect(findIn(pinnedHead, (node) => node.type === 'svg') !== null, 'the pinned section must carry a star glyph')
expect(findIn(pinnedHead, (node) => node.type === 'button') === null, 'the pinned section must not be collapsible')
expect(order('sidePinned') < order('A项目'), 'the pinned section must sit above the first project')
expect(order('sidePinned') < order('sidePrimaryShort'), 'the pinned section must precede every folder section')
expect(nodes.filter((node) => node.props?.['data-session-id'] === 's1').length === 1,
  'a pinned session must appear once, in the pinned section only')
expect(order('sidePinned') < order('A项目会话1'), 'the pinned project session must render inside the pinned section')
const pinnedRow = rowOf('s1')
expect(pinnedRow?.props?.['data-pinned'] === 'true', 'a pinned row must be marked as pinned')
expect(findIn(pinnedRow, (node) => node.props?.['data-pin-mark'] === 'true') === null,
  'a pinned row must not carry a star marker any more')
const plainRow = rowOf('s8')
expect(plainRow?.props?.['data-pinned'] === 'false', 'an unpinned row must not be marked as pinned')

/* A pinned row names its folder, because it sits outside that folder section. */
const pinnedFolder = findIn(pinnedRow, (node) => node.props?.['data-pin-folder'] === 'true')
expect(pinnedFolder !== null, 'a pinned row must name the folder it runs in')
expect(text(pinnedFolder).includes('sidePrimaryShort'), 'the pinned row must mark a primary folder')
expect(text(pinnedFolder).includes('A'), 'the pinned row must name the folder')
expect(findIn(plainRow, (node) => node.props?.['data-pin-folder'] === 'true') === null,
  'an unpinned row must not repeat its section as a badge')

/* Sessions outside every project are grouped by their DSH workspace. */
const workspaceSection = sectionHeadOf('C:/work/Elsewhere')
expect(workspaceSection !== undefined, 'an ungrouped session must get a workspace section head')
expect(text(workspaceSection).includes('Elsewhere'), 'the workspace section must use the workspace title')
expect(order('其他会话') < order('Elsewhere'), 'workspace sections must sit under the ungrouped bucket')
expect(order('Elsewhere') < order('外部会话'), 'the workspace session must hang below its workspace head')
expect(findIn(workspaceSection, (node) => node.type === 'svg') !== null, 'a workspace section must carry the folder glyph')
const looseHead = nodes.find((node) => node.type === 'button' && styleOf(node).fontSize === 13 && text(node).includes('sideNoWorkspace'))
expect(looseHead !== undefined, 'sessions in no workspace must keep a named bucket')
expect(order('sideNoWorkspace') < order('游离会话2'), 'a workspace-less session must render below its bucket head')

/* Pinned rows of every bucket share the single top block. */
expect(order('sidePinned') < order('B项目'), 'the pinned section must precede every project')
expect(order('sidePinned') < order('sideOther'), 'the pinned section must precede the ungrouped bucket')
expect(nodes.filter((node) => node.props?.['data-session-id'] === 's9').length === 1,
  'a pinned ungrouped session must appear once, in the pinned section only')
expect(rowOf('s9')?.props?.['data-pinned'] === 'true',
  'an ungrouped pinned session must also be marked pinned at the top')
/* An ungrouped pinned row has no project folder, so it names its own cwd. */
const looseFolder = findIn(rowOf('s9'), (node) => node.props?.['data-pin-folder'] === 'true')
expect(looseFolder !== null, 'an ungrouped pinned row must name its workspace directory')
expect(text(looseFolder).includes('one'), 'the badge must use the cwd directory name')
/* A turn blocked on the user is the one state that earns a corner badge. */
const pendingCorner = findIn(markOf('s3'), (node) => node.props?.['data-corner'] === 'waiting')
expect(pendingCorner !== null, 'a session waiting on the user must carry the corner badge')
expect(String(styleOf(pendingCorner).background ?? '').includes('state-warn-primary'),
  'the waiting corner badge must be amber')
expect(String(styleOf(pendingCorner).animation ?? '').includes('dsh-projects-pulse'),
  'the waiting corner badge must pulse')
for (const id of ['s1', 's2', 's5']) {
  expect(findIn(markOf(id), (node) => node.props?.['data-corner'] !== undefined) === null,
    `only a waiting session may carry a corner badge (${id})`)
}

const activeStyle = styleOf(runningRow)
expect(String(activeStyle.background ?? '').includes('color-mix'), 'active row must tint the whole row')
expect(String(activeStyle.boxShadow ?? '').includes('brand-primary'), 'active row must carry the brand bar')
expect(String(activeStyle.background ?? '').includes('brand-primary'), 'active row tint must use the brand colour')
const activeTitle = findIn(runningRow, (node) => styleOf(node).fontWeight === 600)
expect(activeTitle !== null, 'active row title must be emphasised')

expect(nodes.some((node) => node.type === 'style' && String(node.props?.children).includes('@keyframes dsh-projects-pulse')),
  'sidebar region must publish the pulsing keyframes')
expect(nodes.some((node) => typeof styleOf(node).background === 'string' && styleOf(node).background.startsWith('hsl(')),
  'project heads must show a project-coloured dot')
expect(nodes.some((node) => String(styleOf(node).animation ?? '').includes('dsh-projects-pulse')),
  'group head must pulse while its project has running sessions')

const badge = callComponent(badgeRegistration.component, {
  t: (key) => key === 'sideCurrent' ? 'current' : key,
  sessionId: 's3',
  useSessions: hooks,
  store,
  manage: () => {},
})
const badgeText = text(badge)
expect(badgeText.includes('A项目'), 'badge must name the project')
expect(badgeText.includes('A-extra'), 'badge must name the current folder')
expect(badgeText.includes('current'), 'badge must mark a non-primary folder')

const primaryBadge = text(callComponent(badgeRegistration.component, {
  t: (key) => key,
  sessionId: 's1',
  useSessions: hooks,
  store,
  manage: () => {},
}))
expect(primaryBadge.includes('sidePrimaryShort'), 'badge must mark the primary workspace')
expect(primaryBadge.includes('current') === false, 'primary badge must not claim a secondary folder')

const outsideBadge = callComponent(badgeRegistration.component, {
  t: (key) => key,
  sessionId: 's4',
  useSessions: hooks,
  store,
  manage: () => {},
})
expect(outsideBadge === null, 'badge must stay absent outside every project')

/* --------------------------------------------------------------- start action */
const startCalls = []
const browser2 = callComponent(browserRegistration.component, {
  t: (key) => key,
  wide: true,
  expandSidebar: () => {},
  useSessions: hooks,
  useWorkspaces: workspaceHooks,
  store,
  start: (project) => startCalls.push(project.id),
  manage: () => {},
  open: () => {},
})
const startButton = (function find(node) {
  if (node === null || node === undefined || node === false) return null
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = find(child)
      if (found !== null) return found
    }
    return null
  }
  if (typeof node !== 'object') return null
  const type = node.type
  if (typeof type === 'function') {
    if (type.prototype instanceof Component) return find(new type(node.props).render())
    return find(callComponent(type, node.props))
  }
  const props = node.props ?? {}
  if (props.title === 'sideNewSession' && typeof props.onClick === 'function') return props
  return find(props.children)
})(browser2)
expect(startButton !== null, 'per-project new-session control missing')
if (startButton !== null) {
  startButton.onClick()
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(startCalls.length === 1, 'new-session control must start exactly one session')
}

/* ------------------------------------------------------------- session menu */
const sessionCalls = []
const menuCalls = []
let hostedRows = [{ type: 'button', props: { role: 'menuitem', children: 'pin' } }]
const menuProps = {
  ...browserProps,
  actions: {
    pin: (id) => sessionCalls.push(['pin', id]),
    unpin: (id) => sessionCalls.push(['unpin', id]),
    archive: (id) => sessionCalls.push(['archive', id]),
    unarchive: (id) => sessionCalls.push(['unarchive', id]),
    fork: (id) => sessionCalls.push(['fork', id]),
    copyId: (id) => sessionCalls.push(['copy', id]),
    rename: (id, title) => sessionCalls.push(['rename', id, title]),
  },
  renderSlot: (name, owner, options) => {
    menuCalls.push({ name, owner, options })
    return hostedRows
  },
}
collect(renderBrowser(menuProps))
const moreButton = findIn(rowOf('s1'), (node) => node.props?.title === 'sideMore')
expect(moreButton !== null, 'a session row must offer a "..." menu trigger')
expect(menuCalls.length === 0, 'the menu must stay closed until it is asked for')
if (moreButton !== null) {
  moreButton.props.onClick({
    stopPropagation: () => {},
    currentTarget: { getBoundingClientRect: () => ({ right: 260, bottom: 120 }) },
  })
}
const opened = collect(renderBrowser(menuProps))
const panel = opened.find((node) => node.props?.['data-session-menu'] !== undefined)
expect(panel !== undefined, 'the "..." trigger must open the session menu')
expect(panel?.props?.['role'] === 'menu', 'the session menu must be a menu element')
expect(menuCalls.length === 1, 'the menu must render the shipped action rows through the slot host')
if (menuCalls.length === 1) {
  expect(menuCalls[0].name === 'sidebar.workspaces.session.menu.item', 'the menu must render the shipped action list')
  expect(menuCalls[0].owner?.sessionId === 's1', 'the menu occurrence must carry the row session')
  expect(menuCalls[0].owner?.displayTitle === 'A项目会话1', 'the menu occurrence must carry the display title')
  expect(typeof menuCalls[0].options?.hookContext?.[1] === 'function', 'the menu rows need the open-state hook')
  menuCalls[0].options.hookContext[1](false)
  const closed = collect(renderBrowser(menuProps))
  expect(closed.find((node) => node.props?.['data-session-menu'] !== undefined) === undefined,
    'dismissing through the hook must close the menu')
}
/* Right-click opens the same menu for the clicked row. */
collect(renderBrowser(menuProps))
const contextRow = rowOf('s3')
expect(typeof contextRow?.props?.onContextMenu === 'function', 'a session row must answer right-click')
if (contextRow !== undefined) {
  contextRow.props.onContextMenu({ preventDefault: () => {}, stopPropagation: () => {}, clientX: 40, clientY: 50 })
}
const rightClicked = collect(renderBrowser(menuProps))
expect(rightClicked.find((node) => node.props?.['data-session-menu'] === 's3') !== undefined,
  'right-clicking a row must open that row menu')
expect(menuCalls[menuCalls.length - 1]?.owner?.sessionId === 's3', 'the right-click menu must target the clicked row')

/* With no rows handed over, the same actions must still be reachable. */
hostedRows = []
collect(renderBrowser(menuProps))
const fallbackRow = rowOf('s1')
fallbackRow.props.onContextMenu({ preventDefault: () => {}, stopPropagation: () => {}, clientX: 30, clientY: 40 })
const fallbackNodes = collect(renderBrowser(menuProps))
const fallbackMenu = fallbackNodes.find((node) => node.props?.['data-session-menu'] === 's1')
expect(fallbackMenu !== undefined, 'the menu must still open when the slot host yields no rows')
const menuItemButtons = fallbackNodes.filter((node) => node.props?.role === 'menuitem')
const menuLabels = menuItemButtons.map((node) => text(node))
for (const label of ['unpin', 'sideRename', 'archive', 'fork', 'sideCopyId', 'open']) {
  expect(menuLabels.includes(label), `fallback menu must offer ${label}`)
}
const archiveButton = menuItemButtons.find((node) => text(node) === 'archive')
if (archiveButton !== undefined) archiveButton.props.onClick()
expect(sessionCalls.some(([name, id]) => name === 'archive' && id === 's1'), 'the archive row must archive its session')

/* Rename opens an inline dialog and renames through the session action. */
collect(renderBrowser(menuProps))
rowOf('s1').props.onContextMenu({ preventDefault: () => {}, stopPropagation: () => {}, clientX: 20, clientY: 30 })
const renameRow = collect(renderBrowser(menuProps))
  .filter((node) => node.props?.role === 'menuitem')
  .find((node) => text(node) === 'sideRename')
expect(renameRow !== undefined, 'the fallback menu must offer rename')
if (renameRow !== undefined) renameRow.props.onClick()
const dialogNodes = collect(renderBrowser(menuProps))
const renameDialog = dialogNodes.find((node) => node.props?.['data-session-rename'] === 's1')
expect(renameDialog !== undefined, 'choosing rename must open the rename dialog')
const renameField = findIn(renameDialog, (node) => node.props?.type === 'text')
expect(renameField !== null, 'the rename dialog must carry a text field')
expect(renameField?.props?.value === 'A项目会话1', 'the rename dialog must start from the current title')
const renameSave = findIn(renameDialog, (node) => node.type === 'button' && text(node) === 'save')
expect(renameSave !== null, 'the rename dialog must offer save')
if (renameSave !== null) renameSave.props.onClick()
await new Promise((resolve) => setTimeout(resolve, 20))
expect(sessionCalls.some(([name, id, title]) => name === 'rename' && id === 's1' && title === 'A项目会话1'),
  'saving the dialog must rename the session through the action')

/* The menu can file a session under another project folder by hand. */
const assignCalls = []
const moveProps = {
  ...menuProps,
  actions: { ...menuProps.actions, assign: (id, target) => assignCalls.push([id, target]) },
}
collect(renderBrowser(moveProps))
rowOf('s1').props.onContextMenu({ preventDefault: () => {}, stopPropagation: () => {}, clientX: 20, clientY: 30 })
const moveMenu = collect(renderBrowser(moveProps))
const moveEntry = moveMenu.find((node) => node.props?.['data-session-move'] === 's1')
expect(moveEntry !== undefined, 'the session menu must offer a move-to-folder entry')
if (moveEntry !== undefined) moveEntry.props.onClick({ stopPropagation: () => {} })
const moveTargets = collect(renderBrowser(moveProps))
expect(moveTargets.find((node) => node.props?.['data-session-menu-mode'] === 'move') !== undefined,
  'the move entry must open the folder picker')
const targetLabels = moveTargets.filter((node) => node.props?.role === 'menuitem').map((node) => text(node))
expect(targetLabels.some((label) => label.includes('sub')), 'the picker must list the additional folders')
expect(targetLabels.some((label) => label.includes('sidePrimaryShort')), 'the picker must list the primary folder')
expect(targetLabels.includes('sideMoveDefault'), 'the picker must always offer the default workspace')
const defaultTarget = moveTargets.find((node) => node.props?.['data-move-default'] === 'true')
expect(defaultTarget !== undefined, 'the default-workspace option must be its own row')
if (defaultTarget !== undefined) defaultTarget.props.onClick({ stopPropagation: () => {} })
expect(assignCalls.length === 1, 'choosing the default workspace must clear the filing once')
expect(assignCalls[0]?.[0] === 's1', 'clearing must name the session')
expect(assignCalls[0]?.[1]?.projectId === '', 'clearing must send an empty project id')
const subTarget = moveTargets.find((node) => node.props?.role === 'menuitem' && text(node) === 'sub')
if (subTarget !== undefined) subTarget.props.onClick({ stopPropagation: () => {} })
expect(assignCalls.length === 2, 'choosing a folder must file the session once')
expect(assignCalls[1]?.[0] === 's1', 'the filing must name the session')
expect(assignCalls[1]?.[1]?.projectId === 'p1', 'the filing must name the project')
expect(assignCalls[1]?.[1]?.folder === 'C:/work/A/sub', 'the filing must name the chosen folder')

/* The real action reports its result, because the menu closes on pick. */
{
  const injected = browserRegistration.options.inject()
  collect(renderBrowser({ ...browserProps, actions: injected.actions }))
  await injected.actions.assign('s1', { projectId: 'p1', folder: 'C:/work/A/sub' })
  await new Promise((resolve) => setTimeout(resolve, 10))
  const feedbackNodes = collect(renderBrowser({ ...browserProps, actions: injected.actions }))
  const feedbackLayer = feedbackNodes.find((node) => node.props?.['data-session-toasts'] !== undefined)
  expect(feedbackLayer !== undefined, 'filing a session must raise a result notice')
  expect(text(feedbackLayer).includes('sideMovedTo'), 'the notice must report where the session was filed')
  /** Dismiss it so the later notification assertions start from a clean layer. */
  for (const close of feedbackNodes.filter((node) => node.type === 'button' && text(node) === '×')) {
    close.props.onClick()
  }
  const cleaned = collect(renderBrowser({ ...browserProps, actions: injected.actions }))
  expect(cleaned.find((node) => node.props?.['data-session-toasts'] !== undefined) === undefined,
    'a dismissed result notice must disappear')
}

/* The project page lists projects first, then opens one project's detail. */
{
  const pageRegistration = registrations.find(
    (entry) => entry.options.name === 'main' && entry.options.key === 'projects',
  )
  expect(pageRegistration !== undefined, 'the main panel page must be registered under key "projects"')
  const recorded = []
  const pageCall = async (method, payload) => {
    recorded.push({ method, payload })
    if (method === 'memory') return { text: '# 已保存的记忆' }
    if (method === 'messages') return { messages: [], enabled: true }
    return {}
  }
  /* Fresh props each render, like the real host re-rendering its panel. */
  const pageProps = () => ({
    t: (key) => key,
    store,
    call: pageCall,
    pickFolder: async () => '',
    startProject: async () => {},
    open: () => {},
    manage: () => {},
  })
  const renderPage = (props) => {
    const tree = callComponent(pageRegistration.component, props)
    const found = []
    walkNodes(tree, (node) => found.push(node))
    return { tree, found }
  }
  const buttonsIn = (found, label) =>
    found.filter((node) => typeof node.type === 'function' && node.props?.label === label)
  const nativeButtons = (found, label) => found.filter((node) => node.type === 'button' && text(node) === label)

  let page = renderPage(pageProps())
  /* The page refreshes the registry in an effect; let that settle first. */
  await new Promise((resolve) => setTimeout(resolve, 10))
  page = renderPage(pageProps())
  let pageText = text(page.tree)
  expect(pageText.includes('A项目'), 'the list must name every project')
  expect(pageText.includes('B项目'), 'the list must name every project')
  expect(pageText.includes('folderCount'), 'a list row must count its folders')
  expect(pageText.includes('fullAccessBadgeOn') === false, 'a full-access project must not clutter its row')
  expect(pageText.includes('fullAccessBadgeOff'), 'a sandboxed project must say so on its row')
  expect(pageText.includes('messagingBadge'), 'a messaging-on project must badge its row')
  expect(pageText.includes('memory') === false, 'the list must not inline the memory room')
  expect(pageText.includes('sectionWorkspaces') === false, 'the list must not inline the workspace table')
  expect(pageText.includes('allProjects') === false, 'the list must not offer a back link')

  /* The edit button opens that project's detail instead of inlining every card. */
  const editButtons = buttonsIn(page.found, 'edit')
  expect(editButtons.length === 2, 'every list row must offer an edit button')
  editButtons[0].props.onClick()
  page = renderPage(pageProps())
  /* The opened detail loads its memory in an effect; let that settle. */
  await new Promise((resolve) => setTimeout(resolve, 5))
  page = renderPage(pageProps())
  pageText = text(page.tree)
  expect(pageText.includes('allProjects'), 'the detail view must offer a back link')
  expect(pageText.includes('memory'), 'the detail view must offer the shared-memory room')
  expect(pageText.includes('memoryDesc'), 'the memory room must say what it is for')
  expect(pageText.includes('messages'), 'the detail view must offer the session-message room')
  expect(pageText.includes('messagesDesc'), 'the message room must describe itself')
  expect(pageText.includes('sectionWorkspaces'), 'the detail view must table the workspaces')
  expect(pageText.includes('colKind'), 'the workspace table must have a kind column')
  expect(pageText.includes('folderTag'), 'the workspace table must tag additional folders')

  /* The shared-memory draft survives a host re-render and saves what was typed. */
  const memoryTextarea = (found) =>
    found.find((node) => node.type === 'textarea' && node.props?.className === 'dshp-editor-input')
  const before = memoryTextarea(page.found)
  expect(before !== null && before !== undefined, 'the detail view must render the memory editor')
  expect(before?.props?.value === '# 已保存的记忆', 'the memory editor must show the saved text')

  /* An untouched memory must not offer a save: the draft equals what the Host has. */
  const idleSave = buttonsIn(page.found, 'saveMemory')
  expect(idleSave.length === 1, 'the memory editor must offer exactly one save button')
  expect(idleSave[0].props?.disabled === true, 'saving must stay disabled while the memory is unchanged')
  const idleClear = buttonsIn(page.found, 'clearMemory')
  expect(idleClear[0]?.props?.disabled === false, 'a non-empty memory must offer a clear action')

  /* A project carries an identity colour, derived when none was chosen. */
  const detailColours = page.found.filter((node) => typeof node.props?.['data-project-color'] === 'string')
  expect(detailColours.length >= 1, 'the detail view must paint the project identity colour')
  expect(String(detailColours[0].props['data-project-color']).startsWith('hsl('),
    'a project without an explicit colour must fall back to the derived hue')

  before?.props?.onChange({ target: { value: '# 手写的记忆' } })
  page = renderPage(pageProps())
  await new Promise((resolve) => setTimeout(resolve, 5))
  const after = memoryTextarea(page.found)
  expect(after?.props?.value === '# 手写的记忆', 'a host re-render must not overwrite the memory draft')
  const saveButtons = buttonsIn(page.found, 'saveMemory')
  expect(saveButtons.length === 1, 'the memory editor must offer a save button')
  expect(saveButtons[0].props?.disabled === false, 'editing the memory must enable saving')
  saveButtons[0].props.onClick()
  await new Promise((resolve) => setTimeout(resolve, 5))
  const saved = recorded.filter((entry) => entry.method === 'memorySave')
  expect(
    saved.length === 1 && saved[0].payload.content === '# 手写的记忆',
    'saving must post the text the user typed',
  )
  page = renderPage(pageProps())
  await new Promise((resolve) => setTimeout(resolve, 5))
  const savedNotices = text(page.tree).split('memorySaved').length - 1
  expect(savedNotices === 1, `a save must be announced in exactly one place (found ${savedNotices})`)
  expect(buttonsIn(page.found, 'saveMemory')[0]?.props?.disabled === true,
    'saving again must be impossible until the memory changes again')

  /* An empty message draft must not offer a send. */
  const sendButtons = buttonsIn(page.found, 'sendMessage')
  expect(sendButtons.length === 1, 'the message room must offer a send button')
  expect(sendButtons[0].props?.disabled === true, 'sending must stay disabled while the message is empty')

  /* The back link returns to the list. */
  const backButtons = buttonsIn(page.found, '← allProjects')
  expect(backButtons.length === 1, 'the detail view must offer one back link')
  backButtons[0].props.onClick()
  const back = renderPage(pageProps())
  expect(text(back.tree).includes('allProjects') === false, 'the back link must return to the list')
  const listColours = back.found.filter((node) => typeof node.props?.['data-project-color'] === 'string')
  expect(listColours.length >= 1, 'every project list row must paint its identity colour')

  /* The page previews the same path: a desktop notice first, dialog only as fallback. */
  const previewButtons = buttonsIn(page.found, 'testNotice')
  expect(previewButtons.length === 1, 'the project page must offer a notification preview')
  const noticesBeforePreview = desktopNotices.length
  previewButtons[0].props.onClick()
  const previewed = renderPage(pageProps())
  expect(desktopNotices.length === noticesBeforePreview + 1, 'the preview must raise a desktop notice')
  expect(previewed.found.some((node) => typeof node.props?.['data-session-toasts'] === 'string') === false,
    'a shown desktop notice must not also paint the preview dialog')
  globalThis.Notification.permission = 'denied'
  previewButtons[0].props.onClick()
  const previewFallback = renderPage(pageProps())
  expect(previewFallback.found.some((node) => typeof node.props?.['data-session-toasts'] === 'string'),
    'a refused desktop notice must fall back to the preview dialog')
  globalThis.Notification.permission = 'granted'
}

/* A finished reply raises the desktop notice and paints no dialog. */
const openedFromNotice = []
const noticeProps = { ...browserProps, open: (id) => openedFromNotice.push(id) }
/** Capture long timers so the test can fire the one-minute close itself. */
const pendingTimers = []
const realSetTimeout = globalThis.setTimeout
globalThis.setTimeout = (fn, delay, ...rest) => {
  if (typeof delay === 'number' && delay >= 1000) {
    pendingTimers.push({ fn, delay })
    return 0
  }
  return realSetTimeout(fn, delay, ...rest)
}
windowFocused = true
const noticesBeforeFinish = desktopNotices.length
statusMap.set('s8', { running: true })
collect(renderBrowser(noticeProps))
statusMap.set('s8', { completionUnread: true })
collect(renderBrowser(noticeProps))
const afterNotice = collect(renderBrowser(noticeProps))
expect(desktopNotices.length === noticesBeforeFinish + 1, 'a finished reply must raise one desktop notice')
expect(desktopNotices[noticesBeforeFinish]?.options?.body === 'A项目会话2',
  'the desktop notice must name the finished session')
expect(afterNotice.find((node) => node.props?.['data-session-toasts'] !== undefined) === undefined,
  'a shown desktop notice must not also paint the in-app dialog')

/* When no desktop notice can be raised, the in-app dialog is the fallback. */
globalThis.Notification.permission = 'denied'
windowFocused = true
statusMap.set('s8', { running: true })
collect(renderBrowser(noticeProps))
statusMap.set('s8', { completionUnread: true })
collect(renderBrowser(noticeProps))
const fallbackNodes2 = collect(renderBrowser(noticeProps))
const dialogLayer = fallbackNodes2.find((node) => node.props?.['data-session-toasts'] !== undefined)
expect(dialogLayer !== undefined, 'a failed desktop notice must fall back to the in-app dialog')
expect(text(dialogLayer).includes('A项目会话2'), 'the dialog must name the finished session')
const dialogOpen = findIn(dialogLayer, (node) => node.props?.['data-toast-open'] === 's8')
expect(dialogOpen !== null, 'the dialog must offer to open its session')
if (dialogOpen !== null) dialogOpen.props.onClick()
expect(openedFromNotice.includes('s8'), 'clicking the dialog must open its session')

/* The one-minute timer takes the dialog down when nobody clicks. */
statusMap.set('s8', { running: true })
collect(renderBrowser(noticeProps))
statusMap.set('s8', { completionUnread: true })
collect(renderBrowser(noticeProps))
collect(renderBrowser(noticeProps))
const closeTimer = pendingTimers.filter((timer) => timer.delay === 60000).pop()
expect(closeTimer !== undefined, 'every dialog must schedule its own one-minute close')
if (closeTimer !== undefined) closeTimer.fn()
const cleared = collect(renderBrowser(noticeProps))
expect(cleared.find((node) => node.props?.['data-session-toasts'] !== undefined) === undefined,
  'the dialog must close itself after one minute')
globalThis.Notification.permission = 'granted'
globalThis.setTimeout = realSetTimeout

if (failures.length > 0) {
  console.error('FAIL dsh-projects client half:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exitCode = 1
} else {
  console.log('PASS dsh-projects client half: project tree, folder sections, pinned bucket, ungrouped workspace sections, hidden rows, badge, shipped state dots, waiting corner badge, active row, session menu (right-click, shipped rows, archive fallback), rename dialog, desktop notice with fallback dialog, project list + detail, editable memory room, message room, start action')
}
