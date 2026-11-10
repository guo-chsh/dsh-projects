# Changelog

All notable changes to this bundle are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
semantic versioning.

## [0.1.7] - 2026-11-10

- Sidebar typography now follows the shipped sidebar: session titles are 14 px
  (the sidebar root size) instead of 12 px, project rows 14 px, folder section
  rows 13 px, and the row height grows to 34 px so nothing feels cramped. Time
  labels, state tags, count badges and the pinned-folder chip move to 11 px.

## [0.1.6] - 2026-11-05

- Picking a "Move to folder…" target now reports the result with a short notice
  ("filed under X" / "manual filing removed" / failure reason). The menu closes
  on pick, so previously a no-op move (for example a session already in that
  folder, or clearing an unset filing) looked like nothing happened.
- The always-available **Default workspace** entry moved to the bottom of the
  picker, so the project folders a user expects to click come first.
- Notification dialogs without a session target no longer show an "Open" button.

## [0.1.5] - 2026-11-05

- The "Move to folder…" panel now always starts with **Default workspace**,
  which drops a manual filing and returns the session to its own working
  directory grouping; previously that option only appeared once a filing
  existed, so a session could not be reset from the picker when opened fresh.

## [0.1.4] - 2026-11-05

Second review pass, bilingual documentation, release preparation.

### Fixed

- Host: project memory and session messages now run their whole
  read-modify-write inside the per-file write queue, so two sessions writing at
  the same moment no longer lose an entry or reuse a message sequence number.
- Host: the memory cache key includes the project id, so two projects with the
  same mtime and size cannot share text.
- Host: saving memory rejects a non-string body instead of silently clearing the
  memory; message bodies are capped at 2000 characters.
- Host: a registry that disappears between stat and read is treated as empty
  instead of failing every route. Deleting a project drops queued read receipts
  and runs its file deletions through the same queue, so an in-flight write
  cannot resurrect the files.
- Host: the same-origin fence runs inside the request guard, so a throwing fence
  still produces a response. Project names and folder lists are capped, project
  ids that collide with Windows device names are rejected, and `DSH_HOME` is
  resolved to an absolute path.
- Client: the sidebar region is wrapped in its failure boundary at the slot
  registration, so a throw inside the component itself no longer takes the host
  sidebar down.
- Client: the completion notice also fires when an unread completion appears
  without the running state having been rendered, never duplicates, and skips
  the session the user is already watching while the window is in front.
- Client: the memory editor reloads when the project changed and the draft is
  clean (no stale draft overwrites an agent update), and a failed load stays
  retryable instead of locking the save button.
- Client: the sidebar shows the loading state instead of "no projects" on the
  first frame; starting a session, forking and copying the session id all handle
  asynchronous failures; folder lists are type-checked.

### Changed

- English `README.md` plus Chinese `README.zh.md`, with language links; both ship
  in the tarball.
- Documentation corrected: tools are registered when the deployment provides a
  `tools` service, memory is capped at 200,000 characters on disk, and the
  project page counts bytes while the Host limit counts characters.

## [0.1.3] - 2026-11-05

- Pinned rows now always name the directory they belong to (project folder or,
  for ungrouped sessions, their own cwd), and the star marker is gone.

## [0.1.2] - 2026-11-05

- Pinned sidebar rows now carry the folder badge of the folder they run in
  (`主区 · A` or the additional folder name, full path on hover), because the
  pinned block sits outside the folder sections that normally express it.

## [0.1.1] - 2026-11-05

Hardening pass after a two-sided code review.

### Fixed

- Project ownership now uses the same separator-aware prefix rule on the Host
  and in the sidebar, so a session started in a project subdirectory gets the
  project's prompt context, tools and full-access preset.
- `project_memory` with `action: "clear"` works again (the non-empty content
  check no longer runs before the clear branch).
- Session rename failures surface in the dialog instead of closing it silently.
- The sidebar no longer changes its hook count when the host omits the session
  status hook.

### Changed

- Removed the Host-side desktop-notice method: the desktop Host is a Node-mode
  process, so it cannot raise Electron notifications. The page's own web
  Notification API is the working path, and the in-app dialog stays as fallback.
- Memory and message-bus writes are serialized per file and land through
  uniquely named temporary files; read receipts are flushed atomically instead
  of truncating the bus file.
- The registry cache also keys on file size, preserves unknown settings keys,
  warns on a newer schema version, and parks a corrupt registry instead of
  failing every route.
- Project ids are validated against a safe charset before they become file
  names; project paths must stay absolute.
- Project memory and messages are quoted/JSON-encoded in the system prompt, so
  stored text cannot forge prompt structure; messages are capped at 2000 chars.
- Internal failures return a generic message; details stay in the Host log.

### Added

- Regression tests: subdirectory ownership, `clear`, prompt quoting, corrupt
  registry recovery, and the notification/dialog split.
- Pinned session counts now match the rendered rows; folder sections carry the
  project colour dot; the rail view renders completion dialogs too.

## [0.1.0] - 2026-11-04

First public release.

### Added

- **Projects** as a named set of physical folders with exactly one primary
  workspace; creation, editing and deletion from the main panel.
- **Sidebar tree** (`sidebar.workspaces` takeover) rendering
  project → pinned / primary workspace / additional folders → sessions, with
  collapsible sections, per-section running counts, a rail mode, and an
  automatic "Other sessions" bucket grouped by shipped workspace.
- **Session state marks** that follow the shipped dot vocabulary (running ring,
  waiting dot plus amber corner badge, done dot, idle dot) and whole-row
  selection styling.
- **Session context menu** hosting the shipped `session.menu.item` rows (pin,
  rename, fork, archive, copy session ID) plus a "Move to folder…" submenu that
  files a session under a project folder. Filing is presentation-only: it never
  changes the session's working directory, and the row tooltip says so.
- **Cross-folder access** (`fullAccess`, default on): sessions started inside a
  project are switched to the deployment's `danger-full-access` permission
  preset so every project folder is readable and writable without approval
  prompts.
- **Shared project memory**: a Markdown note injected into every project
  session on every step (so new sessions and compacted contexts both carry it),
  editable from the project page and through the `project_memory` tool.
- **Session messaging** (`messaging`, default off): an asynchronous per-project
  message bus with broadcast or directed delivery, read-once delivery, and the
  `project_message` tool.
- **Host HTTP API** under `/projects/api` (list, create, update, delete,
  assignSession, memory, memorySave, messages, messageSend) with a same-origin
  fence and atomic registry writes.
- **Project page** with a two-level list → detail layout, a workspace table,
  always-open memory editor with byte counter, always-open message feed, and
  class-based button/input styling with hover and focus feedback.

### Verification

- `_verify/projects-host-check.mjs` — Host half against a fake Cordis context.
- `_verify/projects-client-check.mjs` — Client half against a stub module
  loader and React.
- `_verify/memory-e2e.mjs` — real HTTP server, real files and real prompt
  assembly for the shared memory path (32 checks).