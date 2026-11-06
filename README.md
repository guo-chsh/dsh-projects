# dsh-projects

[简体中文](./README.zh.md) | **English**

Groups several physical folders into one **project** and shows them in the left
sidebar as **project → folder section → session**. Sessions start in the
project's primary workspace; every other folder becomes an additional folder of
the same project.

```
Projects
├─ Project A                    +  ⚙
│  ├─ Session A1
│  └─ Session A2        (docs)   ← its cwd lives in an additional folder
└─ Project B
   └─ Session B1
Other sessions                   ← sessions outside every project
```

## Install

The package is a DSH profile bundle: an npm package plus `dsh.bundle.patch`
(loader patch) and `dsh.client` (browser half).

```text
plugin_manager install_bundle  target: "@guo-chsh/dsh-projects@0.1.6"
```

A local checkout can be installed the same way by passing its absolute
directory path as `target`.

After installing:

1. the left sidebar gains a **Projects** panel entry;
2. open it → **New project** → pick the primary workspace folder → add the other
   folders you want in the same project;
3. back in the sidebar, click `+` on the project row to start a session inside
   the project.

Uninstall / opt out:

- full removal: `plugin_manager remove_bundle` with the package name as target;
- keep the plugin but restore the shipped sidebar browser: set
  `settings.sidebarTakeover` to `false` in `$DSH_HOME/projects.json` and reload
  the page (the project page and the session tools stay available).

## Risks and privacy

Install only if you accept these three points:

1. **Optional full file access.** Projects default to `fullAccess: true`, which
   switches sessions created inside the project to the deployment's
   `danger-full-access` permission preset. The cost is that the **whole session
   loses its file sandbox** (not just the project folders), so paths outside the
   project are no longer fenced either. Uncheck it in the project form to keep
   your normal sandbox policy.
2. **Local files are written.** `$DSH_HOME/projects.json` (registry plus manual
   filings) and `$DSH_HOME/project-memory/<project id>.md` /
   `.messages.json` (shared memory and session messages). Deleting a project
   also removes its own memory and message files.
3. **Content reaches the model prompt.** Shared memory and session messages are
   injected into the project sessions' system prompt (at most 4000 characters of
   memory and 12 unread messages per step), so treat that content as data sent
   to your model provider.

## What you get

| Where | What it does |
|---|---|
| Sidebar panel icon "Projects" | Opens the projects page in the main panel (create / edit / delete) |
| Projects page | **Two-level view**: a project list (name, non-default status badges, primary workspace path, folder count, open/edit/delete); clicking a row or "edit" opens that project's **detail** with a "← All projects" back link. The detail shows the title row, a **Workspaces** table (kind / folder / path, primary highlighted), an **always-expanded shared-memory editor** (16 px semibold title, monospace, 360 px tall and resizable to 65 vh, size counter, save/clear) and an **always-expanded session message feed** with its on/off switch. Memory is read once when the detail opens, so host re-renders never overwrite the draft. The edit form reuses the same sections, switches and table, and toggles folders inline. Buttons and inputs get hover/focus/active feedback from page-level classes; the primary button uses DeepSeek blue (`--dsw-static-deepseek-500`) instead of the near-black `brand-primary`. |
| Sidebar session area (takeover) | Three-level tree **project → folder section → session**; the project row has `+` (new session in the primary workspace) and `⚙` (back to the projects page); archived sessions are hidden by default with a toggle in the section header |
| Folder sections | Each project groups its sessions by folder: `primary · <name>` first, then the additional folders (📁 + name). Every section collapses on its own and shows its session count and running count; which folder a session belongs to is expressed only by its section, rows carry no chip |
| Global pinned block | A single **`★ Pinned`** block at the very top of the sidebar (not collapsible, always expanded) above every project. Each pinned row carries a **directory badge** — `primary · A` or the additional folder name for project sessions, the directory name of its own cwd for ungrouped ones, with the full path on hover — and slightly heavier text, because it does not sit inside its folder section. Pinning still happens through the session context menu or the shipped pin item |
| Completion notice | When a session goes from running to finished, a **desktop notification** is raised regardless of whether the window is in front (title "Reply finished", body is the session name): clicking it returns to the app and opens that session, otherwise it closes itself after one minute. Notifications come from the page's web Notification API — the desktop Host is a Node-mode process and cannot raise Electron notifications. Only when no system notification can be shown (API missing / permission denied) does the in-app dialog in the bottom-right corner take over (also one minute, click to open, stacked bottom-up, at most 5). The two never appear together. Subagent sessions and blank drafts are skipped; the "Test notification" button on the projects page previews it |
| Session row mark | The shipped session-row vocabulary: a **state dot** (16 px cell + 8 px dot), no letters, no folder meaning. A turn waiting on you adds an amber corner badge (pulsing) |
| Other sessions | Sessions outside every project: first the pinned ones, then sections by shipped workspace (header = workspace title or folder name, full path in `title`), and finally "not in a workspace" |
| Session context menu | Right-click a row (or click the `⋯` at its end) to open the shipped menu: pin / rename / fork / archive / copy session ID — those are the official rows of `sidebar.workspaces.session.menu.item`; this plugin only hosts the panel. If that list is not delivered, it falls back to the same actions drawn locally (pin / **rename** / archive / fork / copy ID / open, rename using its own small dialog). The bottom of the menu adds **Move to folder…**, a second panel that files the session under one of a project's folders  |
| Manual filing | Filing only changes where the sidebar shows the session (persisted as `assignments` in `projects.json`); it **never changes the session's working directory** — DSH binds a session to the workspace whose path equals its cwd and has no cross-directory move API. Filed rows say so in their `title`, and the prompt context states the same fact |
| Session state | Same dots as the shipped row, **with one exception: running uses a classic loading ring** (grey track, brand-coloured arc, `dsh-projects-spin` 1200 ms). Running = ring + "running" label; needs you = amber dot + "needs you" + amber corner badge; finished unread = green dot; read/idle = neutral `state-idle` dot; blank drafts draw no dot (same as shipped) |
| Selected session | Whole-row brand tint + 2 px brand bar on the left + semibold title (`color-mix`, follows light/dark themes); unselected rows tint on hover only |
| Project row | Project colour swatch + name + running count badge (breathing dot) |
| Project colour | Optional, one of 10 fixed swatches (blue / indigo / violet / magenta / pink / cyan / teal / green / yellow / orange — **no red**). Unset projects derive a stable colour from their id, so a project keeps it forever. The colour is used for the sidebar project swatch, the folder-section dots, the accent bar and title dot of the project card; the edit form picks it with swatches plus an "auto" option |
| Colour rule | Project hues come from that palette which skips red (0–20, 335–360) and amber (20–55): red means errors and amber means "needs you", so a project colour or badge never reads as an alert |
| Session header chip | `Project · primary A` or `Project · current docs`, with the full primary/current paths in `title`, clicking it returns to the projects page |
| Model context | When a session cwd sits inside any project folder (subdirectories included), the Host injects the project name, primary workspace, additional folder list and the session's file-access mode. Memory is quoted line by line and messages are JSON-encoded and capped at 2000 characters, so stored text cannot forge prompt structure |
| Cross-folder access | Projects default to `fullAccess: true`: the Host switches sessions started inside the project to the `danger-full-access` preset, so code in A, requirements in B and test cases in C are mutually readable and writable without approval prompts. Unchecking it in the project form sets `false`, the sessions keep your own sandbox policy, and the prompt states that the other folders may be read-only |

Session ownership is decided by **cwd prefix** (the deepest matching project
folder wins), so several folders of one project naturally group under one
project node — unlike the shipped rule, which requires a session cwd to equal a
workspace path exactly.

## Usage

1. Sidebar → **Projects** → **New project** → choose the primary workspace
   folder (sessions start there) → optionally add the other folders of the same
   project → save.
2. Back in the sidebar, click `+` on the project row to start a session, or click
   an existing row to open it.
3. When a session moves between folders, the header chip shows which folder it is
   currently in.

## Data and configuration

`$DSH_HOME/projects.json` (defaults to `~/.dsh/projects.json`):

```json
{
  "version": 1,
  "settings": { "sidebarTakeover": true },
  "projects": [{ "id": "…", "name": "Project A", "primaryPath": "C:/work/A", "folders": ["C:/work/A-extra"], "fullAccess": true, "messaging": false, "color": "#3b82f6", "createdAt": "…", "updatedAt": "…" }]
}
```

- `fullAccess` (per project, default `true`): when on, sessions created inside
  the project are switched to the deployment's `danger-full-access` preset on
  `agent/created`, so every project folder is readable and writable without
  approval prompts. **The cost is that the whole session loses its sandbox**,
  not just the project folders — DSH only supports one writable root and has no
  partial-authorisation granularity. Set it to `false` to keep your own policy;
  the prompt context then says the other folders may be read-only. Toggle it in
  the project form.
- `messaging` (per project, **default `false`**): the session-messaging switch.
  When off the prompt has no message section, `project_message` errors out and
  the panel only explains that messaging is off; when on, project sessions can
  exchange asynchronous notes (broadcast or directed), the bus keeps the latest
  300 messages and at most 12 unread are delivered per step. Toggle it in the
  project form; the card shows a badge.
- `settings.sidebarTakeover`: `true` (default) lets this plugin render the
  sidebar as project tree; `false` stops the takeover and restores the shipped
  workspace browser on the next page load (the projects page and the header chip
  stay).
- Absolute paths to existing directories are validated before writing; project
  ids must match `[A-Za-z0-9_-]{1,64}` because they become file names. Every
  write goes through a per-file queue plus a uniquely named temporary file and a
  rename, so two sessions appending to the same memory/bus cannot truncate each
  other; read receipts are queued the same way, so a crash can only repeat a
  message, never lose it.
- The registry cache is keyed by `mtime + size`. A corrupt registry is renamed to
  `projects.json.corrupt-*` and the plugin continues with an empty one (details
  go to the Host log); unknown `settings` keys survive rewrites; a newer schema
  version only logs a warning.

## Project room: shared memory and session messages

Sessions of one project share two things:

| Channel | Storage | Shape |
|---|---|---|
| Shared memory | `$DSH_HOME/project-memory/<project id>.md` | A Markdown note. Every project session re-reads it **on every step** (`systemPrompt.context` is evaluated per step), so it survives new sessions and context compaction. The model reads/appends/replaces/clears it with the `project_memory` tool; the project card's memory editor edits it directly. |
| Session messages | `$DSH_HOME/project-memory/<project id>.messages.json` | An asynchronous note bus. Sessions broadcast (`to` omitted / `all`) or address one session id with `project_message`; recipients see unread notes in their **next step** and each note is marked read once (never repeated), and senders never receive their own messages. The project card lists the feed and can broadcast manually. |

- Both tools are registered by the Host (when the deployment has a `tools` service) and only work when
  the session cwd is inside a project folder; calls from outside error out.
  Deployments without a `tools` service skip the registration and keep working.
- The prompt carries at most `4000` characters of memory (newest part) and `12`
  unread messages, to keep the context bounded; the memory file on disk is capped at 200,000 characters, and the page counts bytes while the Host limit counts characters.
- This is **asynchronous** communication: it never interrupts a running turn. It
  is a shared notebook plus a message board, not a live chat between sessions.

## What the takeover changes

After taking over `sidebar.workspaces`, the shipped search, view options, drag
ordering, pin/fork, workspace rename and delete dialogs no longer appear in that
area. This plugin offers the common equivalents: open session, new session,
archived toggle, new session inside a project, jump to the projects page. To get
the shipped browser back, set `sidebarTakeover: false` as described above.

## Development and testing

Three offline suites, no external dependencies (Node only), run from the
**package root**:

```text
node _verify/projects-host-check.mjs      # Host half: routes, validation, CRUD, prompt, tools, preset, filing
node _verify/projects-client-check.mjs    # Client half: stub module loader + stub React driving real components
node _verify/memory-e2e.mjs               # Shared memory end to end: real HTTP, real disk, real prompt assembly (32 checks)
```

`_verify/` is development-only and **not** part of the npm tarball (the `files`
whitelist excludes it; `npm pack` stays at 10 files).

- `projects-host-check.mjs`: fake ctx drives the Host half (CRUD, validation,
  de-duplication, prompt context, memory reads/writes, message delivery and read
  receipts, tool registration, permission preset switching, filing validation).
- `projects-client-check.mjs`: fake module loader and stubbed React drive the
  Client half (grouping, sections, pinning, hidden rules, badges, row marks and
  the running ring, selected row, context menu and move-to-folder, project
  list → detail, the memory-draft regression, starting sessions).
- `memory-e2e.mjs`: temporary `DSH_HOME` plus a real `http.createServer` and
  real files, verifying the 403 fence, on-disk bytes, cross-project isolation,
  `append` accumulation, 4000-character truncation, the 413 cap, surviving a
  reload and delete cleanup.

Before publishing, run the pack self-check to be sure the `files` whitelist has
no gaps (a local directory install is a junction and does not apply `files`):

```text
npm pack --dry-run
```

## License

MIT, see [LICENSE](./LICENSE).
