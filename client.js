/**
 * Client half of `dsh-projects`: the left-sidebar "Projects" entry and the
 * project manager page it opens in the main panel.
 *
 * Projects live on the Host (see index.js); this module only renders and calls
 * `/projects/api/*`. Starting a session registers the project's primary
 * workspace through the Workspace service and lets the host open a blank
 * session inside it, so the session cwd is the primary workspace while the
 * project's other folders stay part of the same project.
 */
window.__ModuleLoader__.load({
  id: '@guo-chsh/dsh-projects',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    /** Dictionary namespace owned by this plugin. */
    const NS = 'projects'
    /** Sidebar panel id; also the `main` slot key the page registers under. */
    const PANEL_ID = 'projects'

    const en = {
      panel: 'Projects',
      title: 'Projects',
      subtitle: 'One project groups several folders; sessions start in its primary workspace.',
      new: 'New project',
      unit: 'projects',
      folderCount: 'folders',
      allProjects: 'All projects',
      primary: 'Primary workspace',
      folders: 'Other folders',
      addFolder: 'Add folder',
      chooseFolder: 'Choose folder',
      change: 'Change',
      notChosen: 'Not chosen yet',
      primaryHint: 'Sessions of this project start in this folder.',
      primaryRequired: 'Choose a primary workspace to continue.',
      remove: 'Remove',
      open: 'Open session',
      edit: 'Edit',
      delete: 'Delete',
      confirmDelete: 'Confirm delete',
      cancel: 'Cancel',
      create: 'Create project',
      save: 'Save',
      createTitle: 'New project',
      editTitle: 'Edit project',
      name: 'Name',
      color: 'Color',
      colorAuto: 'Automatic',
      colorHint: 'Used for the sidebar, project list and folder sections. Automatic picks a stable colour per project.',
      namePlaceholder: 'Optional, defaults to the folder name',
      foldersHint: 'No additional folders yet. Add the other folders that belong to this project.',
      noFolders: 'No additional folders.',
      fullAccess: 'Let sessions in this project read and write every folder',
      fullAccessHint:
        'DSH confines a session to one writable folder. Turning this on switches sessions started in this project to the danger-full-access preset, so all project folders — and everything else — are writable without approval prompts. Turn it off to keep the normal sandbox.',
      fullAccessBadgeOn: 'full access',
      fullAccessBadgeOff: 'sandboxed',
      memory: 'Shared memory',
      memoryTag: 'Long-term knowledge, read every step',
      memoryHint:
        'Every session of this project reads this note on every step, including after compaction. Agents append durable facts to it through the project_memory tool.',
      memoryEmpty: 'No shared memory yet. Add decisions, conventions, or where things live.',
      saveMemory: 'Save memory',
      clearMemory: 'Clear',
      messages: 'Session messages',
      messagesTag: 'Asynchronous notes between sessions',
      messagesEmpty: 'No messages yet. Sessions of this project can message each other with the project_message tool.',
      messagesOff: 'Session messaging is off for this project.',
      messagesOffHint: 'Turn on “Allow sessions of this project to message each other” in Edit to use it.',
      messagePlaceholder: 'Message every session of this project…',
      sendMessage: 'Send',
      messageAll: 'all sessions',
      memorySaved: 'Memory saved.',
      memorySavedHint: 'No unsaved changes',
      messaging: 'Allow sessions of this project to message each other',
      messagingHint:
        'Off by default. When on, sessions of this project can leave each other notes with the project_message tool — broadcast or addressed to one session — delivered on the recipient’s next step. Nobody is interrupted. Useful when several sessions work on the same project in parallel.',
      messagingBadge: 'messaging on',
      formSubtitle: 'One project groups several folders; its sessions share one memory.',
      panelDesc: 'Sessions started here run in the primary workspace and share everything below.',
      sectionWorkspaces: 'Workspaces',
      sectionProject: 'Project',
      sectionFolders: 'Folders',
      sectionSessions: 'Sessions',
      sectionMemory: 'Shared room',
      colKind: 'Kind',
      colFolder: 'Folder',
      colPath: 'Path',
      folderTag: 'additional',
      memoryDesc: 'Preferences and facts this project remembers across tasks. Every session reads it on every step.',
      memoryFootHint: 'Markdown · appended by agents through project_memory',
      messagesDesc: 'Asynchronous notes between sessions of this project. Delivered on the recipient’s next step.',
      loading: 'Loading projects…',
      retry: 'Retry',
      emptyTitle: 'No projects yet',
      emptyHint: 'Create a project to group folders and launch sessions in its primary workspace.',
      saved: 'Project saved.',
      deleted: 'Project deleted.',
      updatedAt: 'Updated',
      working: 'Working…',
      sideProjects: 'Projects',
      sideOther: 'Other sessions',
      sideNewSession: 'New session',
      sideManage: 'Manage projects',
      sideNewProject: 'New project',
      sidePrimaryShort: 'primary',
      sidePinned: 'Pinned',
      sidePinnedHint: 'Pinned across every project',
      sideCurrent: 'current',
      sideShowArchived: 'Show archived',
      sideHideArchived: 'Hide archived',
      sideEmpty: 'No projects yet. Create one to group folders and start sessions inside it.',
      sideNoSessions: 'No sessions in this project yet.',
      sideRunning: 'running',
      sideWaiting: 'needs you',
      toastDone: 'Reply finished',
      testNotice: 'Test notification',
      testNoticeHint: 'Preview the desktop notice raised when a reply finishes in the background',
      testNoticeBody: 'This is how a finished reply reaches you while the window is in the background.',
      testNoticeBlocked:
        'No desktop notification appeared. Allow notifications for DeepSeek Harness in your system settings, then try again.',
      sideFolder: 'Folder',
      sideNoWorkspace: 'No workspace',
      sideMore: 'More actions',
      sideCopyId: 'Copy session ID',
      sideRename: 'Rename session',
      sideRenameTitle: 'Rename session',
      sideMove: 'Move to folder…',
      sideMoveDefault: 'Default workspace',
      sideMoveDefaultHint: 'Group this session by its own working directory again (drop the manual filing)',
      sideMovedTo: 'Filed under',
      sideMoveRestored: 'Manual filing removed: the session is grouped by its own workspace again.',
      sideMoveFailed: 'Could not file the session',
      sideNotice: 'Notification',
      sideNoTargets: 'No project folders to move into yet.',
      sideFiledHint: 'Filed by hand; the session still runs in',
      pin: 'Pin',
      unpin: 'Unpin',
      archive: 'Archive',
      unarchive: 'Unarchive',
      fork: 'Fork',
      sideFailure:
        'The projects sidebar failed to render. Reload the page, or disable the dsh-projects bundle to restore the shipped session list.',
      justNow: 'now',
      badgePrimary: 'Primary workspace',
      badgeCurrent: 'Current folder',
    }

    const zh = {
      panel: '项目',
      title: '项目',
      subtitle: '一个项目可以包含多个文件夹；会话在项目的主工作区中启动。',
      new: '新建项目',
      unit: '个项目',
      folderCount: '个文件夹',
      allProjects: '全部项目',
      primary: '主工作区',
      folders: '其他文件夹',
      addFolder: '添加文件夹',
      chooseFolder: '选择文件夹',
      change: '更改',
      notChosen: '尚未选择',
      primaryHint: '项目内新建的会话都在这个文件夹里启动。',
      primaryRequired: '请先选择主工作区。',
      remove: '移除',
      open: '打开会话',
      edit: '编辑',
      delete: '删除',
      confirmDelete: '确认删除',
      cancel: '取消',
      create: '创建项目',
      save: '保存',
      createTitle: '新建项目',
      editTitle: '编辑项目',
      name: '名称',
      color: '颜色',
      colorAuto: '自动',
      colorHint: '用于侧栏、项目列表与文件夹分区。选「自动」时按项目稳定推导一个颜色。',
      namePlaceholder: '可留空，默认使用文件夹名',
      foldersHint: '还没有其他文件夹。可以把属于该项目的其他目录添加进来。',
      noFolders: '没有其他文件夹。',
      fullAccess: '允许该项目的会话读写所有文件夹',
      fullAccessHint:
        'DSH 只允许一个会话写入一个工作区。开启后，在该项目中启动的会话会切到 danger-full-access 预设：项目内所有文件夹（以及其它路径）都可读写且不弹审批。关闭则保持你当前的沙箱策略。',
      fullAccessBadgeOn: '全盘访问',
      fullAccessBadgeOff: '沙箱内',
      memory: '共享记忆',
      memoryTag: '长期知识，每步都会读到',
      memoryHint:
        '本项目的每个会话在每一步都会读到这份笔记（压缩之后也不会丢）。会话通过 project_memory 工具追加需要长期保留的结论：决策、约定、文件位置、坑。',
      memoryEmpty: '还没有共享记忆。可以写决策、约定、或文件放在哪里。',
      saveMemory: '保存记忆',
      clearMemory: '清空',
      messages: '会话消息',
      messagesTag: '会话之间的异步便签',
      messagesEmpty: '还没有消息。本项目内的会话可以用 project_message 工具互相留言。',
      messagesOff: '本项目的会话消息已关闭。',
      messagesOffHint: '在「编辑」里打开「允许项目内会话互相留言」即可使用。',
      messagePlaceholder: '给本项目所有会话发一条消息…',
      sendMessage: '发送',
      messageAll: '全部会话',
      memorySaved: '记忆已保存。',
      memorySavedHint: '没有未保存的修改',
      messaging: '允许项目内会话互相留言',
      messagingHint:
        '默认关闭。开启后，本项目内的会话可以用 project_message 工具互相留便签——广播或定向给某个会话——收件方在下一步才看到，不会打断正在进行的回合。适合多个会话并行推进同一个项目时使用。',
      messagingBadge: '消息已开',
      formSubtitle: '一个项目把多个文件夹归在一起，项目内的会话共享同一份知识。',
      panelDesc: '在这里启动的会话运行于主工作区，并共享下面这些内容。',
      sectionWorkspaces: '工作区',
      sectionProject: '项目',
      sectionFolders: '文件夹',
      sectionSessions: '会话',
      sectionMemory: '共享房间',
      colKind: '类型',
      colFolder: '文件夹',
      colPath: '路径',
      folderTag: '附加',
      memoryDesc: '本项目跨会话记住的偏好与事实，每一步都会被读取。',
      memoryFootHint: 'Markdown · 会话通过 project_memory 追加',
      messagesDesc: '项目内会话之间的异步便签，收件方在下一步收到。',
      loading: '正在加载项目…',
      retry: '重试',
      emptyTitle: '还没有项目',
      emptyHint: '创建一个项目，把多个文件夹归入其中，并在主工作区中启动会话。',
      saved: '项目已保存。',
      deleted: '项目已删除。',
      updatedAt: '更新于',
      working: '处理中…',
      sideProjects: '项目',
      sideOther: '其他会话',
      sideNewSession: '新建会话',
      sideManage: '管理项目',
      sideNewProject: '新建项目',
      sidePrimaryShort: '主区',
      sidePinned: '置顶',
      sidePinnedHint: '所有项目中置顶的会话',
      sideCurrent: '当前',
      sideShowArchived: '显示已归档',
      sideHideArchived: '隐藏已归档',
      sideEmpty: '还没有项目。创建一个项目来归组文件夹，并在项目内启动会话。',
      sideNoSessions: '这个项目里还没有会话。',
      sideRunning: '进行中',
      sideWaiting: '待确认',
      toastDone: '回复完成',
      testNotice: '测试通知',
      testNoticeHint: '预览「窗口在后台时回复完成」所弹出的系统通知',
      testNoticeBody: '窗口不在前台时，回复完成就是这样通知你的。',
      testNoticeBlocked: '没有弹出桌面通知：请在系统设置里允许 DeepSeek Harness 发送通知，然后再试一次。',
      sideFolder: '文件夹',
      sideNoWorkspace: '未归入工作区',
      sideMore: '更多操作',
      sideCopyId: '复制会话 ID',
      sideRename: '重命名会话',
      sideRenameTitle: '重命名会话',
      sideMove: '移动到文件夹…',
      sideMoveDefault: '默认工作区',
      sideMoveDefaultHint: '按会话自己的工作目录重新归组（取消手动归类）',
      sideMovedTo: '已归入',
      sideMoveRestored: '已取消手动归类，会话重新按自己的工作区归组。',
      sideMoveFailed: '归类失败',
      sideNotice: '提示',
      sideNoTargets: '还没有可归入的项目文件夹。',
      sideFiledHint: '已手动归入；会话实际运行于',
      pin: '置顶',
      unpin: '取消置顶',
      archive: '归档',
      unarchive: '取消归档',
      fork: '分叉',
      sideFailure: '项目侧栏渲染失败。请刷新页面，或禁用 dsh-projects bundle 以恢复官方会话列表。',
      justNow: '刚刚',
      badgePrimary: '主工作区',
      badgeCurrent: '当前文件夹',
    }

    const IS_WINDOWS =
      typeof navigator !== 'undefined' && /win/i.test(String(navigator.platform || navigator.userAgent || ''))

    /** Platform-aware comparison key for one absolute path. */
    function pathKey(path) {
      const normalized = String(path ?? '')
        .replace(/\\/g, '/')
        .replace(/\/+$/, '')
      return IS_WINDOWS ? normalized.toLowerCase() : normalized
    }

    /** Human-readable text for a thrown value. */
    function messageOf(error) {
      if (error instanceof Error && error.message !== '') return error.message
      return String(error)
    }

    /** UTF-8 byte length of one string, for the memory editor counter. */
    function byteLength(text) {
      const value = String(text ?? '')
      try {
        return new TextEncoder().encode(value).length
      } catch {
        return value.length
      }
    }

    const styles = {
      page: {
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        background: 'var(--dsw-alias-bg-base)',
        color: 'var(--dsw-alias-label-primary)',
      },
      header: {
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px',
        borderBottom: '1px solid var(--dsw-alias-border-l1)',
      },
      headerText: { minWidth: 0, flex: '1 1 auto' },
      h1: { margin: 0, fontSize: 16, lineHeight: '22px', fontWeight: 600 },
      subtitle: { marginTop: 2, fontSize: 12, lineHeight: '16px', color: 'var(--dsw-alias-label-secondary)' },
      headerActions: { display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' },
      scroll: { flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '16px 20px 28px' },
      list: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 960 },
      card: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '14px 16px',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 12,
        background: 'var(--dsw-alias-bg-layer-1)',
      },
      cardHead: { display: 'flex', alignItems: 'center', gap: 12 },
      nameWrap: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: '1 1 auto' },
      name: { fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      badge: {
        flex: '0 0 auto',
        fontSize: 11,
        lineHeight: '16px',
        padding: '0 6px',
        borderRadius: 6,
        color: 'var(--dsw-alias-brand-primary)',
        border: '1px solid var(--dsw-alias-brand-primary)',
      },
      actions: { display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' },
      pathRow: { display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 },
      pathLabel: { flex: '0 0 auto', fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' },
      code: {
        minWidth: 0,
        fontSize: 12,
        lineHeight: '18px',
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
        wordBreak: 'break-all',
      },
      folderBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
      folderList: { display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 2 },
      folderRow: { display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 },
      bullet: { flex: '0 0 auto', color: 'var(--dsw-alias-label-secondary)', lineHeight: '18px' },
      hint: { fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' },
      meta: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-secondary)' },
      swatchRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
      swatch: {
        width: 22,
        height: 22,
        padding: 0,
        borderRadius: '50%',
        border: '2px solid transparent',
        boxShadow: 'inset 0 0 0 1px rgba(15,17,21,0.12)',
        cursor: 'pointer',
        flex: '0 0 auto',
      },
      swatchOn: { borderColor: 'var(--dsw-alias-label-primary)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent)' },
      swatchAuto: {
        background: 'linear-gradient(135deg, #3b82f6 0 33%, #22c55e 33% 66%, #eab308 66% 100%)',
      },
      muted: { fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' },
      empty: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        maxWidth: 520,
        padding: '28px 24px',
        border: '1px dashed var(--dsw-alias-border-l2)',
        borderRadius: 12,
        background: 'var(--dsw-alias-bg-layer-1)',
      },
      emptyTitle: { fontSize: 14, fontWeight: 600 },
      errorBox: {
        maxWidth: 720,
        padding: '12px 14px',
        border: '1px solid var(--dsw-alias-state-error-primary, #d64545)',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'flex-start',
      },
      errorText: { fontSize: 12, lineHeight: '18px', wordBreak: 'break-word' },
      notice: {
        flex: '0 0 auto',
        margin: '10px 20px 0',
        padding: '8px 12px',
        fontSize: 12,
        lineHeight: '18px',
        borderRadius: 8,
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-2)',
        color: 'var(--dsw-alias-label-secondary)',
        wordBreak: 'break-word',
      },
      form: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        maxWidth: 640,
        padding: '18px 20px',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 12,
        background: 'var(--dsw-alias-bg-layer-1)',
      },
      formTitle: { margin: 0, fontSize: 14, fontWeight: 600 },
      field: { display: 'flex', flexDirection: 'column', gap: 6 },
      fieldHead: { display: 'flex', alignItems: 'center', gap: 10 },
      fieldLabel: { fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' },
      checkRow: { display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' },
      checkbox: { margin: '2px 0 0', flex: '0 0 auto', accentColor: 'var(--dsw-alias-brand-primary)' },
      checkText: { display: 'flex', flexDirection: 'column', gap: 2 },
      pickRow: { display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 },
      input: {
        width: '100%',
        boxSizing: 'border-box',
        padding: '7px 10px',
        fontSize: 13,
        lineHeight: '18px',
        color: 'var(--dsw-alias-label-primary)',
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        outline: 'none',
      },
      formHead: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        paddingBottom: 14,
        borderBottom: '1px solid var(--dsw-alias-border-l1)',
      },
      formSub: { margin: 0, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' },
      formSection: { display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16 },
      formDivider: { height: 1, marginTop: 16, background: 'var(--dsw-alias-border-l1)' },
      formSectionHead: { display: 'flex', alignItems: 'center', gap: 8 },
      formSectionLabel: {
        fontSize: 11,
        lineHeight: '16px',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--dsw-alias-label-secondary)',
      },
      countBadge: {
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        boxSizing: 'border-box',
        borderRadius: 9,
        fontSize: 10,
        lineHeight: '18px',
        textAlign: 'center',
        color: 'var(--dsw-alias-label-secondary)',
        background: 'var(--dsw-alias-bg-layer-2)',
      },
      rowField: { display: 'flex', flexDirection: 'column', gap: 6 },
      rowHint: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-secondary)' },
      pathEditRow: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 },
      pathCurrent: {
        flex: '1 1 auto',
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 8px',
        borderRadius: 8,
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
        color: 'var(--dsw-alias-label-secondary)',
      },
      folderItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 6px 5px 8px',
        borderRadius: 8,
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
      },
      folderItemName: {
        flex: '1 1 auto',
        minWidth: 0,
        fontSize: 12,
        lineHeight: '18px',
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      iconButton: {
        flex: '0 0 auto',
        width: 22,
        height: 22,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        border: '1px solid transparent',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        cursor: 'pointer',
        fontSize: 13,
        lineHeight: 1,
        fontFamily: 'inherit',
      },
      toggleRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '9px 10px',
        borderRadius: 10,
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-2)',
        cursor: 'pointer',
      },
      toggleText: { flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
      toggleTitle: { fontSize: 13, lineHeight: '18px', color: 'var(--dsw-alias-label-primary)' },
      toggleHint: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-secondary)' },
      toggleInput: { flex: '0 0 auto', marginTop: 2, accentColor: 'var(--dsw-alias-brand-primary)' },
      formFooter: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingTop: 16,
        borderTop: '1px solid var(--dsw-alias-border-l1)',
      },
      footerNote: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-secondary)' },
      roomHead: { display: 'flex', alignItems: 'center', gap: 6, paddingTop: 2, flexWrap: 'wrap' },
      roomEntry: {
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 1,
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-2)',
        color: 'var(--dsw-alias-label-primary)',
        fontFamily: 'inherit',
        cursor: 'pointer',
        textAlign: 'left',
      },
      roomEntryTitle: { fontSize: 12, lineHeight: '16px', fontWeight: 500 },
      roomEntryTag: { fontSize: 10, lineHeight: '14px', color: 'var(--dsw-alias-label-secondary)' },
      roomNote: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-state-error-primary)' },
      roomPanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 10,
        borderRadius: 10,
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-2)',
      },
      roomList: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' },
      roomItem: { display: 'flex', flexDirection: 'column', gap: 2 },
      roomMeta: { fontSize: 10, lineHeight: '14px', color: 'var(--dsw-alias-label-secondary)' },
      roomText: { fontSize: 12, lineHeight: '18px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
      roomActions: { display: 'flex', alignItems: 'center', gap: 8 },
      textarea: {
        width: '100%',
        boxSizing: 'border-box',
        minHeight: 120,
        padding: '8px 10px',
        fontSize: 12,
        lineHeight: '18px',
        fontFamily: 'inherit',
        color: 'var(--dsw-alias-label-primary)',
        background: 'var(--dsw-alias-bg-layer-1)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        outline: 'none',
        resize: 'vertical',
      },
      /* ---------------------------------------------------------------- *
       * Settings surface. Deliberately one card per project with uppercase
       * section labels, a real table for folders, pill switches and a
       * bordered editor with a byte counter — the vocabulary a preference
       * page in a mainstream IDE uses, built only from theme tokens.
       * ---------------------------------------------------------------- */
      panel: {
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 820,
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 12,
        background: 'var(--dsw-alias-bg-layer-1)',
        overflow: 'hidden',
      },
      panelHead: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: '16px 20px 14px',
      },
      panelHeadText: { flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 },
      panelTitle: { margin: 0, fontSize: 15, lineHeight: '21px', fontWeight: 600 },
      panelDesc: { fontSize: 12.5, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' },
      panelActions: { display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' },
      /* Compact project row: the list view before a project is opened. */
      projectRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 16px',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 10,
        background: 'var(--dsw-alias-bg-layer-1)',
      },
      projectRowMain: {
        flex: '1 1 auto',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        cursor: 'pointer',
        outline: 'none',
      },
      projectRowTitleLine: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' },
      projectRowTitle: {
        fontSize: 14,
        fontWeight: 600,
        lineHeight: '20px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      projectRowMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        minWidth: 0,
        fontSize: 12,
        lineHeight: '18px',
        color: 'var(--dsw-alias-label-secondary)',
      },
      projectRowPath: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
      },
      projectRowActions: { display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' },
      backRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 },
      section: { display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--dsw-alias-border-l1)' },
      sectionHead: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 20px 8px',
      },
      sectionLabel: {
        fontSize: 11,
        lineHeight: '16px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--dsw-alias-label-secondary)',
      },
      sectionCount: {
        fontSize: 11,
        lineHeight: '16px',
        color: 'var(--dsw-alias-label-secondary)',
      },
      /** Card section heading for the two guest-visibility blocks. */
      sectionTitle: {
        fontSize: 15,
        lineHeight: '24px',
        fontWeight: 600,
        letterSpacing: '0.01em',
        color: 'var(--dsw-alias-label-primary)',
      },
      sectionHint: {
        fontSize: 12.5,
        lineHeight: '19px',
        color: 'var(--dsw-alias-label-secondary)',
        padding: '0 20px 12px',
      },
      sectionBody: { display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px 16px' },
      fieldRow: { display: 'flex', alignItems: 'flex-start', gap: 16 },
      fieldLabelCol: {
        flex: '0 0 104px',
        fontSize: 13,
        lineHeight: '28px',
        color: 'var(--dsw-alias-label-secondary)',
      },
      fieldControl: { flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 },
      tableWrap: {
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        overflow: 'hidden',
      },
      table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
      th: {
        textAlign: 'left',
        padding: '6px 10px',
        fontSize: 10.5,
        lineHeight: '16px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'var(--dsw-alias-label-secondary)',
        background: 'var(--dsw-alias-bg-layer-2)',
        borderBottom: '1px solid var(--dsw-alias-border-l1)',
        whiteSpace: 'nowrap',
      },
      td: {
        padding: '7px 10px',
        fontSize: 12.5,
        lineHeight: '18px',
        borderBottom: '1px solid var(--dsw-alias-border-l1)',
        verticalAlign: 'middle',
        overflow: 'hidden',
      },
      tdMono: {
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
        fontSize: 11.5,
        color: 'var(--dsw-alias-label-secondary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
      tag: {
        display: 'inline-flex',
        alignItems: 'center',
        height: 18,
        padding: '0 6px',
        borderRadius: 5,
        fontSize: 10.5,
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        border: '1px solid var(--dsw-alias-border-l1)',
        color: 'var(--dsw-alias-label-secondary)',
      },
      tagPrimary: {
        background: 'color-mix(in srgb, var(--dsw-static-deepseek-500, #4176e6) 10%, transparent)',
        borderColor: 'color-mix(in srgb, var(--dsw-static-deepseek-500, #4176e6) 38%, transparent)',
        color: 'var(--dsw-static-deepseek-500, #4176e6)',
      },
      settingRow: { display: 'flex', alignItems: 'flex-start', gap: 16, padding: '12px 20px' },
      settingText: { flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
      settingTitle: { fontSize: 13, lineHeight: '20px', fontWeight: 500 },
      settingHint: { fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' },
      switch: {
        flex: '0 0 auto',
        position: 'relative',
        width: 34,
        height: 20,
        padding: 0,
        marginTop: 1,
        borderRadius: 999,
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-2)',
        cursor: 'pointer',
        transition: 'background 140ms ease, border-color 140ms ease',
      },
      switchOn: {
        background: 'var(--dsw-static-deepseek-500, #4176e6)',
        borderColor: 'var(--dsw-static-deepseek-500, #4176e6)',
      },
      knob: {
        position: 'absolute',
        top: 2,
        left: 2,
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        transition: 'transform 140ms ease',
      },
      knobOn: { transform: 'translateX(14px)' },
      /** Live-session spinner: the conventional loading ring, not a pulsing dot. */
      sideSpinner: {
        width: 13,
        height: 13,
        boxSizing: 'border-box',
        borderRadius: '50%',
        borderStyle: 'solid',
        borderWidth: 1.75,
        borderColor: 'var(--dsw-alias-border-l2)',
        borderTopColor: 'var(--dsw-alias-brand-primary)',
        borderRightColor: 'var(--dsw-alias-brand-primary)',
        animation: 'dsh-projects-spin 1200ms linear infinite',
      },
      chevron: { flex: '0 0 auto', fontSize: 11, lineHeight: '20px', color: 'var(--dsw-alias-label-secondary)' },
      editor: {
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        background: 'var(--dsw-alias-bg-base)',
        overflow: 'hidden',
      },
      editorInput: {
        width: '100%',
        boxSizing: 'border-box',
        minHeight: 180,
        maxHeight: 420,
        padding: '12px 14px',
        fontSize: 12.5,
        lineHeight: '20px',
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
        color: 'var(--dsw-alias-label-primary)',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        resize: 'vertical',
      },
      editorFoot: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 12px',
        borderTop: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-2)',
        fontSize: 11,
        lineHeight: '16px',
        color: 'var(--dsw-alias-label-secondary)',
      },
      counter: {
        marginLeft: 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
        fontSize: 11,
      },
      feed: {
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 260,
        overflowY: 'auto',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
      },
      feedItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        padding: '9px 12px',
        borderBottom: '1px solid var(--dsw-alias-border-l1)',
      },
      feedMeta: { fontSize: 10.5, lineHeight: '15px', color: 'var(--dsw-alias-label-secondary)' },
      feedText: { fontSize: 12.5, lineHeight: '18px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
      inlineNote: { fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' },
    }

    /**
     * Page-scoped stylesheet for the project manager: real class rules give the
     * buttons and text fields hover/focus feedback that inline styles cannot
     * express. Rendered as a React element so unmounting removes it.
     */
    const PAGE_CSS = `
.dshp-btn,.dshp-input,.dshp-chat,.dshp-editor{--dshp-accent:var(--dsw-static-deepseek-500,#4176e6);--dshp-accent-hover:var(--dsw-static-deepseek-450,#5686fe)}
.dshp-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;padding:0 14px;font-family:inherit;font-size:13px;font-weight:500;line-height:1;border-radius:8px;border:1px solid transparent;cursor:pointer;white-space:nowrap;transition:background 120ms ease,border-color 120ms ease,color 120ms ease,box-shadow 120ms ease,transform 60ms ease}
.dshp-btn:disabled{opacity:.45;cursor:not-allowed}
.dshp-btn:focus-visible{outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--dshp-accent) 26%,transparent)}
.dshp-btn--primary{background:var(--dshp-accent);color:#fff;font-weight:600;box-shadow:0 1px 2px rgba(15,17,21,.18)}
.dshp-btn--primary:hover:not(:disabled){background:var(--dshp-accent-hover);box-shadow:0 2px 6px color-mix(in srgb,var(--dshp-accent) 35%,transparent)}
.dshp-btn--primary:active:not(:disabled){transform:translateY(1px);box-shadow:none}
.dshp-btn--secondary{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.dshp-btn--secondary:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:color-mix(in srgb,var(--dshp-accent) 35%,var(--dsw-alias-border-l2))}
.dshp-btn--secondary:active:not(:disabled){transform:translateY(1px)}
.dshp-btn--ghost{background:transparent;color:var(--dsw-alias-label-secondary)}
.dshp-btn--ghost:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dshp-btn--danger{background:transparent;color:var(--dsw-alias-state-error-primary,#d64545);border-color:var(--dsw-alias-border-l2)}
.dshp-btn--danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#d64545) 10%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#d64545) 45%,var(--dsw-alias-border-l1))}
.dshp-input{width:100%;box-sizing:border-box;height:34px;padding:0 11px;font-family:inherit;font-size:13px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;outline:none;transition:border-color 120ms ease,box-shadow 120ms ease,background 120ms ease}
.dshp-input::placeholder{color:var(--dsw-alias-label-secondary)}
.dshp-input:hover{border-color:var(--dsw-alias-border-l2)}
.dshp-input:focus{border-color:var(--dshp-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--dshp-accent) 16%,transparent)}
.dshp-chat{width:100%;box-sizing:border-box;min-height:72px;padding:10px 12px;font-family:inherit;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:9px;outline:none;resize:vertical;transition:border-color 120ms ease,box-shadow 120ms ease}
.dshp-chat::placeholder{color:var(--dsw-alias-label-secondary)}
.dshp-chat:hover{border-color:var(--dsw-alias-border-l2)}
.dshp-chat:focus{border-color:var(--dshp-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--dshp-accent) 16%,transparent)}
.dshp-editor{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-bg-base);overflow:hidden;transition:border-color 140ms ease,box-shadow 140ms ease}
.dshp-editor:hover{border-color:var(--dsw-alias-border-l2)}
.dshp-editor:focus-within{border-color:var(--dshp-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--dshp-accent) 15%,transparent)}
.dshp-editor-input{width:100%;box-sizing:border-box;min-height:360px;max-height:65vh;padding:16px 18px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:13px;line-height:21px;color:var(--dsw-alias-label-primary);background:transparent;border:none;outline:none;resize:vertical}
.dshp-editor-input::placeholder{color:var(--dsw-alias-label-secondary)}
.dshp-table tbody tr:hover{background:var(--dsw-alias-bg-layer-2)}
.dshp-row{transition:border-color 120ms ease,box-shadow 120ms ease,background 120ms ease}
.dshp-row:hover{border-color:color-mix(in srgb,var(--dshp-accent) 30%,var(--dsw-alias-border-l2));box-shadow:0 2px 8px rgba(15,17,21,.06)}
.dshp-rowmain:focus-visible{outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--dshp-accent) 24%,transparent);border-radius:8px}
`

    

    /** One text button; the variant class carries colour, hover and focus. */
    function Button(props) {
      const variant = props.variant ?? 'secondary'
      return h(
        'button',
        {
          type: 'button',
          className: `dshp-btn dshp-btn--${variant}`,
          disabled: props.disabled === true,
          title: props.title,
          onClick: props.onClick,
        },
        props.label,
      )
    }

    /** One single-line text input. */
    function TextInput(props) {
      return h('input', {
        type: 'text',
        className: 'dshp-input',
        value: props.value,
        placeholder: props.placeholder,
        onChange: props.onChange,
        spellCheck: false,
      })
    }

    /** Sidebar glyph: a folder whose contents stand for several roots. */
    function ProjectsIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 18
      const active = props.active === true
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 20 20',
          fill: 'none',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('path', {
          d: 'M2.75 6.1c0-.97.79-1.75 1.75-1.75h2.62c.46 0 .9.18 1.24.5l.94.88h6.2c.97 0 1.75.78 1.75 1.75v6.62c0 .97-.78 1.75-1.75 1.75H4.5c-.96 0-1.75-.78-1.75-1.75Z',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M5.4 10.4h9.2M5.4 13.1h6.1',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
          opacity: active ? 1 : 0.7,
        }),
      )
    }

    /** One pill switch: a real button with role=switch, so it stays keyboard reachable. */
    function Switch(props) {
      const on = props.checked === true
      return h(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': on ? 'true' : 'false',
          'data-switch': on ? 'on' : 'off',
          disabled: props.disabled === true,
          title: props.title,
          onClick: (event) => {
            event.stopPropagation()
            if (props.disabled === true) return
            props.onChange(!on)
          },
          style: {
            ...styles.switch,
            ...(on ? styles.switchOn : null),
            ...(props.disabled === true ? { opacity: 0.5, cursor: 'default' } : null),
          },
        },
        h('span', { style: { ...styles.knob, ...(on ? styles.knobOn : null) } }),
      )
    }

    /** Title and explanation on the left, one control on the right. */
    function SettingRow(props) {
      const { title, hint, control, onClick, expanded } = props
      return h(
        'div',
        {
          style: { ...styles.settingRow, cursor: onClick ? 'pointer' : 'default' },
          onClick,
        },
        h(
          'div',
          { style: styles.settingText },
          h('span', { style: styles.settingTitle }, title),
          hint ? h('span', { style: styles.settingHint }, hint) : null,
        ),
        control,
        expanded === undefined ? null : h('span', { style: styles.chevron }, expanded ? '▾' : '▸'),
      )
    }

    /** The create/edit form for one project draft. */
    function ProjectForm(props) {
      const { t, draft, setDraft, busy } = props
      const editing = draft.id !== undefined
      const folders = Array.isArray(draft.folders) ? draft.folders : []
      const noPrimary = draft.primaryPath === ''
      const field = (label, control, hint) =>
        h(
          'div',
          { style: styles.fieldRow },
          h('span', { style: styles.fieldLabelCol }, label),
          h(
            'div',
            { style: styles.fieldControl },
            control,
            hint ? h('span', { style: styles.settingHint }, hint) : null,
          ),
        )
      return h(
        'section',
        { style: styles.panel, 'aria-label': editing ? t('editTitle') : t('createTitle') },
        h(
          'header',
          { style: styles.panelHead },
          h(
            'div',
            { style: styles.panelHeadText },
            h('h2', { style: styles.panelTitle }, editing ? t('editTitle') : t('createTitle')),
            h('p', { style: styles.panelDesc }, t('formSubtitle')),
          ),
        ),
        h(
          'div',
          { style: styles.section },
          h(
            'div',
            { style: styles.sectionHead },
            h('span', { style: styles.sectionLabel }, t('sectionProject')),
          ),
          h(
            'div',
            { style: styles.sectionBody },
            field(
              t('name'),
              h(TextInput, {
                value: draft.name,
                placeholder: t('namePlaceholder'),
                onChange: (event) => setDraft({ ...draft, name: event.target.value }),
              }),
            ),
            field(
              t('color'),
              h(
                'div',
                { style: styles.swatchRow, role: 'radiogroup', 'aria-label': t('color') },
                h('button', {
                  key: 'auto',
                  type: 'button',
                  title: t('colorAuto'),
                  'aria-label': t('colorAuto'),
                  'data-swatch': 'auto',
                  style: {
                    ...styles.swatch,
                    ...styles.swatchAuto,
                    ...(typeof draft.color !== 'string' || draft.color === '' ? styles.swatchOn : null),
                  },
                  onClick: () => setDraft({ ...draft, color: '' }),
                }),
                PROJECT_PALETTE.map((value) =>
                  h('button', {
                    key: value,
                    type: 'button',
                    title: value,
                    'aria-label': value,
                    'data-swatch': value,
                    style: {
                      ...styles.swatch,
                      background: value,
                      ...(draft.color === value ? styles.swatchOn : null),
                    },
                    onClick: () => setDraft({ ...draft, color: value }),
                  }),
                ),
              ),
              t('colorHint'),
            ),
            field(
              t('primary'),
              h(
                'div',
                { style: styles.pathEditRow },
                h(
                  'span',
                  { style: styles.pathCurrent },
                  noPrimary
                    ? h('span', { style: styles.muted }, t('notChosen'))
                    : h(
                        'code',
                        { style: { ...styles.code, flex: '1 1 auto', minWidth: 0 }, title: draft.primaryPath },
                        draft.primaryPath,
                      ),
                ),
                h(Button, {
                  label: noPrimary ? t('chooseFolder') : t('change'),
                  onClick: props.onPickPrimary,
                  disabled: busy,
                }),
              ),
              t('primaryHint'),
            ),
          ),
        ),
        h(
          'div',
          { style: styles.section },
          h(
            'div',
            { style: styles.sectionHead },
            h('span', { style: styles.sectionLabel }, t('sectionFolders')),
            h('span', { style: styles.sectionCount }, String(folders.length)),
            h('span', { style: { flex: '1 1 auto' } }),
            h(Button, { label: t('addFolder'), onClick: props.onAddFolder, disabled: busy }),
          ),
          h(
            'div',
            { style: styles.sectionBody },
            folders.length === 0 && noPrimary
              ? h('span', { style: styles.inlineNote }, t('foldersHint'))
              : h(
                  'div',
                  { style: styles.tableWrap },
                  h(
                    'table',
                    { style: styles.table },
                    h(
                      'thead',
                      null,
                      h(
                        'tr',
                        null,
                        h('th', { style: { ...styles.th, width: 104 } }, t('colKind')),
                        h('th', { style: { ...styles.th, width: 180 } }, t('colFolder')),
                        h('th', { style: styles.th }, t('colPath')),
                        h('th', { style: { ...styles.th, width: 44 } }, ''),
                      ),
                    ),
                    h(
                      'tbody',
                      null,
                      noPrimary
                        ? null
                        : h(
                            'tr',
                            null,
                            h(
                              'td',
                              { style: styles.td },
                              h('span', { style: { ...styles.tag, ...styles.tagPrimary } }, t('primary')),
                            ),
                            h('td', { style: styles.td }, baseName(draft.primaryPath)),
                            h(
                              'td',
                              { style: styles.td },
                              h(
                                'code',
                                { style: { ...styles.tdMono, display: 'block' }, title: draft.primaryPath },
                                draft.primaryPath,
                              ),
                            ),
                            h('td', { style: styles.td }),
                          ),
                      folders.map((folder) =>
                        h(
                          'tr',
                          { key: folder },
                          h('td', { style: styles.td }, h('span', { style: styles.tag }, t('folderTag'))),
                          h('td', { style: styles.td }, baseName(folder)),
                          h(
                            'td',
                            { style: styles.td },
                            h('code', { style: { ...styles.tdMono, display: 'block' }, title: folder }, folder),
                          ),
                          h(
                            'td',
                            { style: styles.td },
                            h(
                              'button',
                              {
                                type: 'button',
                                style: styles.iconButton,
                                title: t('remove'),
                                'aria-label': `${t('remove')} ${folder}`,
                                disabled: busy,
                                onClick: () => props.onDropFolder(folder),
                              },
                              '×',
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
          ),
        ),
        h(
          'div',
          { style: styles.section },
          h(
            'div',
            { style: styles.sectionHead },
            h('span', { style: styles.sectionLabel }, t('sectionSessions')),
          ),
          h(
            'div',
            { style: styles.sectionBody },
            h(SettingRow, {
              title: t('fullAccess'),
              hint: t('fullAccessHint'),
              control: h(Switch, {
                checked: draft.fullAccess !== false,
                disabled: busy,
                title: t('fullAccessHint'),
                onChange: (value) => setDraft({ ...draft, fullAccess: value }),
              }),
            }),
            h(SettingRow, {
              title: t('messaging'),
              hint: t('messagingHint'),
              control: h(Switch, {
                checked: draft.messaging === true,
                disabled: busy,
                title: t('messagingHint'),
                onChange: (value) => setDraft({ ...draft, messaging: value }),
              }),
            }),
          ),
        ),
        h(
          'div',
          { style: styles.formFooter },
          h('span', { style: styles.footerNote }, noPrimary ? t('primaryRequired') : ''),
          h('span', { style: { flex: '1 1 auto' } }),
          h(Button, { label: t('cancel'), onClick: props.onCancel, disabled: busy }),
          h(Button, {
            label: editing ? t('save') : t('create'),
            variant: 'primary',
            onClick: props.onSave,
            disabled: busy || noPrimary,
          }),
        ),
      )
    }

    /** One project card: identity, primary workspace, additional folders, actions. */
    function ProjectCard(props) {
      const { t, project, busy } = props
      const confirming = props.confirmId === project.id
      const [memoryDraft, setMemoryDraft] = React.useState('')
      const [memoryBaseline, setMemoryBaseline] = React.useState('')
      const [messages, setMessages] = React.useState([])
      const [messageDraft, setMessageDraft] = React.useState('')
      const [roomBusy, setRoomBusy] = React.useState(false)
      const [memoryNote, setMemoryNote] = React.useState('')
      const [messageNote, setMessageNote] = React.useState('')

      /**
       * The memory section is always open, so its body loads on mount and again
       * whenever the project itself changed (for example after an agent updated
       * the memory). A dirty draft is never clobbered, and a failed load leaves
       * the section retryable instead of locking it.
       */
      const call = props.call
      const projectId = project.id
      const projectUpdatedAt = project.updatedAt
      const [memorySyncedAt, setMemorySyncedAt] = React.useState(null)
      const [messagesLoaded, setMessagesLoaded] = React.useState(false)

      const loadMemory = React.useCallback(async () => {
        try {
          const value = await call('memory', { id: projectId })
          const text = typeof value?.text === 'string' ? value.text : ''
          setMemoryDraft(text)
          setMemoryBaseline(text)
          setMemorySyncedAt(projectUpdatedAt)
        } catch (failure) {
          setMemoryNote(messageOf(failure))
        }
      }, [call, projectId, projectUpdatedAt])

      /** The message feed is always open too; it loads regardless of the switch. */
      const loadMessages = React.useCallback(async () => {
        try {
          const value = await call('messages', { id: projectId })
          setMessages(Array.isArray(value?.messages) ? value.messages : [])
        } catch (failure) {
          setMessageNote(messageOf(failure))
        }
      }, [call, projectId])

      React.useEffect(() => {
        if (memorySyncedAt === projectUpdatedAt) return
        /** Keep what the user is typing: never reload over a dirty draft. */
        if (memoryDraft !== memoryBaseline) return
        void loadMemory()
      }, [loadMemory, memorySyncedAt, projectUpdatedAt, memoryDraft, memoryBaseline])

      React.useEffect(() => {
        if (messagesLoaded) return
        setMessagesLoaded(true)
        void loadMessages()
      }, [loadMessages, messagesLoaded])

      const saveMemory = async (content) => {
        setRoomBusy(true)
        setMemoryNote('')
        try {
          await call('memorySave', { id: projectId, content })
          setMemoryDraft(content)
          setMemoryBaseline(content)
          setMemoryNote(t('memorySaved'))
        } catch (failure) {
          setMemoryNote(messageOf(failure))
        } finally {
          setRoomBusy(false)
        }
      }

      const sendMessage = async () => {
        if (roomBusy === true) return
        const text = messageDraft.trim()
        if (text === '') return
        setRoomBusy(true)
        setMessageNote('')
        try {
          await call('messageSend', { id: projectId, text })
          setMessageDraft('')
          const value = await call('messages', { id: projectId })
          setMessages(Array.isArray(value?.messages) ? value.messages : [])
        } catch (failure) {
          setMessageNote(messageOf(failure))
        } finally {
          setRoomBusy(false)
        }
      }

      /** Flip the messaging switch straight from the card. */
      const setMessaging = async (next) => {
        setRoomBusy(true)
        setMessageNote('')
        try {
          await call('update', { id: projectId, messaging: next })
          if (typeof props.onRefresh === 'function') await props.onRefresh()
          await loadMessages()
        } catch (failure) {
          setMessageNote(messageOf(failure))
        } finally {
          setRoomBusy(false)
        }
      }

      const messagingOn = project.messaging === true
      const memoryBytes = byteLength(memoryDraft)
      /** Save only means something once the draft differs from what the Host has. */
      const memoryDirty = memoryDraft !== memoryBaseline

      const memorySection = h(
        'div',
        { style: styles.section },
        h(
          'div',
          { style: styles.sectionHead },
          h('span', { style: styles.sectionTitle }, t('memory')),
        ),
        h('div', { style: styles.sectionHint }, t('memoryDesc')),
        h(
          'div',
          { style: { ...styles.sectionBody, paddingTop: 0 } },
          h(
            'div',
            { className: 'dshp-editor' },
            h('textarea', {
              className: 'dshp-editor-input',
              value: memoryDraft,
              placeholder: t('memoryEmpty'),
              spellCheck: false,
              onChange: (event) => setMemoryDraft(event.target.value),
            }),
            h(
              'div',
              { style: styles.editorFoot },
              h('span', null, t('memoryFootHint')),
              h('span', { style: styles.counter }, `${memoryBytes.toLocaleString('en-US')} bytes`),
            ),
          ),
          h(
            'div',
            { style: styles.roomActions },
            h(Button, {
              label: t('saveMemory'),
              variant: 'primary',
              disabled: roomBusy || memoryDirty === false,
              title: memoryDirty === false ? t('memorySavedHint') : undefined,
              onClick: () => void saveMemory(memoryDraft),
            }),
            h(Button, {
              label: t('clearMemory'),
              variant: 'ghost',
              disabled: roomBusy || memoryDraft === '',
              onClick: () => void saveMemory(''),
            }),
            memoryNote === '' ? null : h('span', { style: styles.roomNote }, memoryNote),
          ),
        ),
      )

      const messageSection = h(
        'div',
        { style: styles.section },
        h(
          'div',
          { style: styles.sectionHead },
          h('span', { style: styles.sectionTitle }, t('messages')),
          h('span', { style: { flex: '1 1 auto' } }),
          h(Switch, {
            checked: messagingOn,
            disabled: busy || roomBusy,
            title: t('messagingHint'),
            onChange: (value) => void setMessaging(value),
          }),
        ),
        h('div', { style: styles.sectionHint }, messagingOn ? t('messagesDesc') : t('messagesOffHint')),
        h(
          'div',
          { style: { ...styles.sectionBody, paddingTop: 0 } },
          messagingOn
            ? messages.length === 0
              ? h('span', { style: styles.inlineNote }, t('messagesEmpty'))
              : h(
                  'div',
                  { style: styles.feed },
                  messages
                    .slice()
                    .reverse()
                    .map((message) =>
                      h(
                        'div',
                        { style: styles.feedItem, key: String(message.seq) },
                        h(
                          'div',
                          { style: styles.feedMeta },
                          `${typeof message.at === 'string' ? new Date(message.at).toLocaleString() : ''} · ${
                            message.fromTitle || message.from || '—'
                          } → ${
                            message.to === null || message.to === undefined ? t('messageAll') : message.to
                          }`,
                        ),
                        h('div', { style: styles.feedText }, String(message.text ?? '')),
                      ),
                    ),
                )
            : h('span', { style: styles.inlineNote }, `${t('messagesOff')} ${t('messagesOffHint')}`),
          messagingOn
            ? h(
                'div',
                { style: styles.roomActions },
                h('input', {
                  className: 'dshp-chat',
                  value: messageDraft,
                  placeholder: t('messagePlaceholder'),
                  onChange: (event) => setMessageDraft(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') void sendMessage()
                  },
                }),
                h(Button, {
                  label: t('sendMessage'),
                  variant: 'primary',
                  disabled: roomBusy || messageDraft.trim() === '',
                  onClick: () => void sendMessage(),
                }),
              )
            : null,
          messageNote === '' ? null : h('span', { style: styles.roomNote }, messageNote),
        ),
      )

      const workspaceRows = [
        { path: project.primaryPath, primary: true },
        ...(Array.isArray(project.folders) ? project.folders : []).map((folder) => ({
          path: folder,
          primary: false,
        })),
      ]
      const workspaceSection = h(
        'div',
        { style: styles.section },
        h(
          'div',
          { style: styles.sectionHead },
          h('span', { style: styles.sectionLabel }, t('sectionWorkspaces')),
          h('span', { style: styles.sectionCount }, String(workspaceRows.length)),
          h('span', { style: { flex: '1 1 auto' } }),
          h(
            'span',
            { style: styles.sectionCount },
            `${t('updatedAt')} ${project.updatedAt === '' ? '—' : new Date(project.updatedAt).toLocaleString()}`,
          ),
        ),
        h(
          'div',
          { style: styles.sectionBody },
          h(
            'div',
            { style: styles.tableWrap },
            h(
              'table',
              { style: styles.table },
              h(
                'thead',
                null,
                h(
                  'tr',
                  null,
                  h('th', { style: { ...styles.th, width: 104 } }, t('colKind')),
                  h('th', { style: { ...styles.th, width: 180 } }, t('colFolder')),
                  h('th', { style: styles.th }, t('colPath')),
                ),
              ),
              h(
                'tbody',
                null,
                workspaceRows.map((row) =>
                  h(
                    'tr',
                    { key: row.path },
                    h(
                      'td',
                      { style: styles.td },
                      h(
                        'span',
                        { style: row.primary ? { ...styles.tag, ...styles.tagPrimary } : styles.tag },
                        row.primary ? t('primary') : t('folderTag'),
                      ),
                    ),
                    h('td', { style: styles.td }, baseName(row.path)),
                    h(
                      'td',
                      { style: styles.td },
                      h('code', { style: { ...styles.tdMono, display: 'block' }, title: row.path }, row.path),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      )

      return h(
        'article',
        { style: { ...styles.panel, borderLeft: `3px solid ${projectColorOf(project)}` } },
        h(
          'header',
          { style: styles.panelHead },
          h(
            'div',
            { style: styles.panelHeadText },
            h(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
              h('span', {
                key: 'color',
                'data-project-color': projectColorOf(project),
                title: t('color'),
                style: { flex: '0 0 auto', width: 9, height: 9, borderRadius: '50%', background: projectColorOf(project) },
              }),
              h('h2', { style: { ...styles.panelTitle, minWidth: 0 }, title: project.name }, project.name),
              project.fullAccess === false
                ? h('span', { style: styles.tag, title: t('fullAccessHint') }, t('fullAccessBadgeOff'))
                : null,
              project.messaging === true
                ? h('span', { style: styles.tag, title: t('messagingHint') }, t('messagingBadge'))
                : null,
            ),
            h('p', { style: styles.panelDesc }, t('panelDesc')),
          ),
          h(
            'div',
            { style: styles.panelActions },
            h(Button, { label: t('open'), variant: 'primary', disabled: busy, onClick: () => props.onOpen(project) }),
            h(Button, { label: t('edit'), disabled: busy, onClick: () => props.onEdit(project) }),
            confirming
              ? h(
                  React.Fragment,
                  null,
                  h(Button, {
                    label: t('confirmDelete'),
                    variant: 'danger',
                    disabled: busy,
                    onClick: () => props.onDelete(project.id),
                  }),
                  h(Button, { label: t('cancel'), disabled: busy, onClick: props.onCancelDelete }),
                )
              : h(Button, {
                  label: t('delete'),
                  variant: 'ghost',
                  disabled: busy,
                  onClick: () => props.onRequestDelete(project.id),
                }),
          ),
        ),
        workspaceSection,
        memorySection,
        messageSection,
      )
    }

    /** One row of the project list: identity, folder count, and row actions. */
    function ProjectRow(props) {
      const { t, project, busy } = props
      const confirming = props.confirmId === project.id
      const folders = Array.isArray(project.folders) ? project.folders : []
      const openDetail = () => props.onDetail(project)
      return h(
        'div',
        { style: styles.projectRow, className: 'dshp-row' },
        h(
          'div',
          {
            style: styles.projectRowMain,
            className: 'dshp-rowmain',
            role: 'button',
            tabIndex: 0,
            title: t('edit'),
            onClick: openDetail,
            onKeyDown: (event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              openDetail()
            },
          },
          h(
            'div',
            { style: styles.projectRowTitleLine },
            h('span', {
              'data-project-color': projectColorOf(project),
              style: { flex: '0 0 auto', width: 9, height: 9, borderRadius: '50%', background: projectColorOf(project) },
            }),
            h('span', { style: styles.projectRowTitle, title: project.name }, project.name),
            project.fullAccess === false
              ? h('span', { style: styles.tag, title: t('fullAccessHint') }, t('fullAccessBadgeOff'))
              : null,
            project.messaging === true
              ? h('span', { style: styles.tag, title: t('messagingHint') }, t('messagingBadge'))
              : null,
          ),
          h(
            'div',
            { style: styles.projectRowMeta },
            h('code', { style: styles.projectRowPath, title: project.primaryPath }, project.primaryPath),
            h('span', null, `· ${1 + folders.length} ${t('folderCount')}`),
          ),
        ),
        h(
          'div',
          { style: styles.projectRowActions },
          h(Button, { label: t('open'), variant: 'primary', disabled: busy, onClick: () => props.onOpen(project) }),
          confirming
            ? h(
                React.Fragment,
                null,
                h(Button, {
                  label: t('confirmDelete'),
                  variant: 'danger',
                  disabled: busy,
                  onClick: () => props.onDelete(project.id),
                }),
                h(Button, { label: t('cancel'), disabled: busy, onClick: props.onCancelDelete }),
              )
            : [
                h(Button, { key: 'edit', label: t('edit'), disabled: busy, onClick: openDetail }),
                h(Button, {
                  key: 'delete',
                  label: t('delete'),
                  variant: 'ghost',
                  disabled: busy,
                  onClick: () => props.onRequestDelete(project.id),
                }),
              ],
        ),
      )
    }

    /** The main-panel page: project list, per-project detail, create/edit form. */
    function ProjectsPage(props) {
      const { t, call, pickFolder, startProject, store } = props
      const snapshot = useSnapshot(store)
      const status = snapshot.status === 'idle' ? 'loading' : snapshot.status
      const projects = snapshot.projects
      const error = snapshot.error
      const [notice, setNotice] = React.useState(null)
      /** Preview items for the completion dialog, shown by the same component. */
      const [previews, setPreviews] = React.useState([])
      const [draft, setDraft] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [confirmId, setConfirmId] = React.useState(null)
      /** `null` shows the project list; an id opens that project's detail. */
      const [detailId, setDetailId] = React.useState(null)

      const refresh = React.useCallback(() => store.refresh(), [store])

      React.useEffect(() => {
        void refresh()
      }, [refresh])

      const startCreate = () => {
        setNotice(null)
        setConfirmId(null)
        setDetailId(null)
        setDraft({ name: '', primaryPath: '', folders: [], fullAccess: true, messaging: false, color: '' })
      }

      const startEdit = (project) => {
        setNotice(null)
        setConfirmId(null)
        setDraft({
          id: project.id,
          name: project.name,
          primaryPath: project.primaryPath,
          folders: Array.isArray(project.folders) ? [...project.folders] : [],
          fullAccess: project.fullAccess !== false,
          messaging: project.messaging === true,
          color: typeof project.color === 'string' ? project.color : '',
        })
      }

      const choosePrimary = async () => {
        try {
          const path = await pickFolder()
          if (typeof path !== 'string' || path === '') return
          setDraft((current) => (current === null ? current : { ...current, primaryPath: path }))
        } catch (failure) {
          setNotice(messageOf(failure))
        }
      }

      const addFolder = async () => {
        try {
          const path = await pickFolder()
          if (typeof path !== 'string' || path === '') return
          setDraft((current) => {
            if (current === null) return current
            if (current.primaryPath !== '' && pathKey(current.primaryPath) === pathKey(path)) return current
            if (current.folders.some((folder) => pathKey(folder) === pathKey(path))) return current
            return { ...current, folders: [...current.folders, path] }
          })
        } catch (failure) {
          setNotice(messageOf(failure))
        }
      }

      const dropFolder = (folder) => {
        setDraft((current) =>
          current === null ? current : { ...current, folders: current.folders.filter((entry) => entry !== folder) },
        )
      }

      const save = async () => {
        if (draft === null || draft.primaryPath === '') return
        setBusy(true)
        setNotice(null)
        try {
          const payload = {
            name: draft.name,
            primaryPath: draft.primaryPath,
            folders: draft.folders,
            fullAccess: draft.fullAccess !== false,
            messaging: draft.messaging === true,
            color: typeof draft.color === 'string' ? draft.color : '',
          }
          if (draft.id === undefined) await call('create', payload)
          else await call('update', { id: draft.id, ...payload })
          setDraft(null)
          await refresh()
          setNotice(t('saved'))
        } catch (failure) {
          setNotice(messageOf(failure))
        } finally {
          setBusy(false)
        }
      }

      const remove = async (id) => {
        setBusy(true)
        setNotice(null)
        try {
          await call('delete', { id })
          setConfirmId(null)
          await refresh()
          setNotice(t('deleted'))
        } catch (failure) {
          setNotice(messageOf(failure))
        } finally {
          setBusy(false)
        }
      }

      const open = async (project) => {
        setBusy(true)
        setNotice(null)
        try {
          await startProject(project)
        } catch (failure) {
          setNotice(messageOf(failure))
        } finally {
          setBusy(false)
        }
      }

      /** Preview the same notice the completion path raises (dialog only as fallback). */
      const testNotice = () => {
        setNotice(null)
        const key = `preview:${Date.now()}`
        const item = { key, id: '', title: t('testNoticeBody') }
        if (raiseDesktopNotice(t('toastDone'), item, () => {}) === true) return
        setPreviews((list) => [...list, item].slice(-COMPLETION_DIALOG_MAX))
        setTimeout(() => setPreviews((list) => list.filter((entry) => entry.key !== key)), COMPLETION_DIALOG_TTL_MS)
      }

      const detail = detailId === null ? undefined : projects.find((project) => project.id === detailId)
      const body =
        draft !== null
          ? h(ProjectForm, {
              t,
              draft,
              setDraft,
              busy,
              onPickPrimary: choosePrimary,
              onAddFolder: addFolder,
              onDropFolder: dropFolder,
              onSave: save,
              onCancel: () => {
                setDraft(null)
                setNotice(null)
              },
            })
          : status === 'loading'
            ? h('div', { style: styles.muted }, t('loading'))
            : status === 'error'
              ? h(
                  'div',
                  { style: styles.errorBox },
                  h('div', { style: styles.errorText }, error ?? ''),
                  h(Button, { label: t('retry'), onClick: () => void refresh() }),
                )
              : projects.length === 0
                ? h(
                    'div',
                    { style: styles.empty },
                    h('div', { style: styles.emptyTitle }, t('emptyTitle')),
                    h('div', { style: styles.muted }, t('emptyHint')),
                    h(Button, { label: t('new'), variant: 'primary', onClick: startCreate }),
                  )
                : detail !== undefined
                  ? h(
                      'div',
                      { style: styles.list },
                      h(
                        'div',
                        { style: styles.backRow },
                        h(Button, {
                          label: `← ${t('allProjects')}`,
                          variant: 'ghost',
                          onClick: () => {
                            setDetailId(null)
                            setConfirmId(null)
                          },
                        }),
                      ),
                      h(ProjectCard, {
                        key: detail.id,
                        t,
                        project: detail,
                        busy,
                        confirmId,
                        call,
                        onRefresh: refresh,
                        onOpen: open,
                        onEdit: startEdit,
                        onRequestDelete: (id) => setConfirmId(id),
                        onCancelDelete: () => setConfirmId(null),
                        onDelete: async (id) => {
                          await remove(id)
                          setDetailId(null)
                        },
                      }),
                    )
                  : h(
                      'div',
                      { style: styles.list },
                      projects.map((project) =>
                        h(ProjectRow, {
                          key: project.id,
                          t,
                          project,
                          busy,
                          confirmId,
                          onDetail: (value) => setDetailId(value.id),
                          onOpen: open,
                          onRequestDelete: (id) => setConfirmId(id),
                          onCancelDelete: () => setConfirmId(null),
                          onDelete: remove,
                        }),
                      ),
                    )

      return h(
        'section',
        { style: styles.page, 'aria-label': t('title') },
        h('style', { key: 'projects-page-css' }, PAGE_CSS),
        h(
          'header',
          { style: styles.header },
          h(
            'div',
            { style: styles.headerText },
            h('h1', { style: styles.h1 }, t('title')),
            h('div', { style: styles.subtitle }, t('subtitle')),
          ),
          h(
            'div',
            { style: styles.headerActions },
            h(
              'span',
              { style: styles.muted },
              `${projects.length} ${t('unit')}`,
              busy ? ` · ${t('working')}` : '',
            ),
            h(Button, {
              label: t('testNotice'),
              variant: 'ghost',
              title: t('testNoticeHint'),
              onClick: testNotice,
            }),
            h(Button, {
              label: t('new'),
              variant: 'primary',
              onClick: startCreate,
              disabled: busy || draft !== null,
            }),
          ),
        ),
        notice === null ? null : h('div', { style: styles.notice, role: 'status' }, notice),
        h('div', { style: styles.scroll }, body),
        h(SessionToasts, {
          key: 'preview-dialogs',
          t,
          toasts: previews,
          onOpen: () => {},
          onDismiss: (key) => setPreviews((list) => list.filter((entry) => entry.key !== key)),
        }),
      )
    }

    /* ------------------------------------------------------------------------ *
     * Project-first session tree (`sidebar.workspaces`) and the session header
     * badge. The Host registry is the source of truth: a session belongs to a
     * project when its cwd equals, or lies inside, one of that project's
     * folders. Sessions opened inside a project are therefore grouped under it
     * even though DSH itself groups sessions strictly by exact workspace path.
     * ------------------------------------------------------------------------ */

    const sideStyles = {
      side: {
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        minHeight: 0,
        borderTop: '1px solid var(--dsw-alias-border-l1)',
      },
      head: { display: 'flex', alignItems: 'center', gap: 2, padding: '8px 8px 2px 10px' },
      headTitle: {
        flex: '1 1 auto',
        minWidth: 0,
        fontSize: 11,
        lineHeight: '16px',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        color: 'var(--dsw-alias-label-secondary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      iconButton: {
        flex: '0 0 auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        padding: 0,
        fontSize: 13,
        lineHeight: '16px',
        color: 'var(--dsw-alias-label-secondary)',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 6,
        fontFamily: 'inherit',
        cursor: 'pointer',
      },
      scroll: { flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '2px 6px 12px' },
      group: { display: 'flex', flexDirection: 'column', marginBottom: 2 },
      groupHead: { display: 'flex', alignItems: 'center', gap: 2 },
      disclosure: {
        flex: '1 1 auto',
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 4px 3px 2px',
        background: 'transparent',
        border: 'none',
        borderRadius: 8,
        color: 'var(--dsw-alias-label-primary)',
        fontFamily: 'inherit',
        fontSize: 12,
        lineHeight: '18px',
        cursor: 'pointer',
        textAlign: 'left',
      },
      caret: {
        flex: '0 0 auto',
        width: 10,
        display: 'inline-block',
        transformOrigin: '50% 50%',
        transition: 'transform 120ms ease',
        color: 'var(--dsw-alias-label-secondary)',
      },
      groupTitle: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 },
      count: {
        flex: '0 0 auto',
        fontSize: 10,
        lineHeight: '15px',
        padding: '0 5px',
        borderRadius: 999,
        background: 'var(--dsw-alias-bg-layer-2)',
        color: 'var(--dsw-alias-label-secondary)',
      },
      sectionHead: { display: 'flex', alignItems: 'center', gap: 2, paddingLeft: 16 },
      sectionDisclosure: {
        flex: '1 1 auto',
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '1px 4px 1px 2px',
        background: 'transparent',
        border: 'none',
        borderRadius: 7,
        color: 'var(--dsw-alias-label-secondary)',
        fontFamily: 'inherit',
        fontSize: 11,
        lineHeight: '16px',
        cursor: 'pointer',
        textAlign: 'left',
      },
      sectionTitle: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      sectionGlyph: { flex: '0 0 auto', display: 'inline-flex', alignItems: 'center' },
      sectionDot: { flex: '0 0 auto', width: 6, height: 6, borderRadius: '50%' },
      rows: { display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 12 },
      sessionRow: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        minHeight: 30,
        boxSizing: 'border-box',
        padding: '6px 6px 6px 4px',
        borderRadius: 8,
        cursor: 'pointer',
        color: 'var(--dsw-alias-label-primary)',
        outline: 'none',
        transition: 'background 120ms ease, box-shadow 120ms ease',
      },
      sessionRowHover: { background: 'var(--dsw-alias-bg-layer-2)' },
      sessionRowActive: {
        backgroundColor: 'var(--dsw-alias-bg-layer-2)',
        background:
          'color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, var(--dsw-alias-bg-layer-1))',
        boxShadow: 'inset 2px 0 0 0 var(--dsw-alias-brand-primary)',
        color: 'var(--dsw-alias-label-primary)',
      },
      sessionTitleActive: { fontWeight: 600 },
      /** Pinned rows read a touch stronger than the rest. */
      sessionTitlePinned: { fontWeight: 500 },
      /** Folder badge of a pinned row: it is not inside its folder section. */
      pinFolder: {
        flex: '0 0 auto',
        maxWidth: 84,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 10,
        lineHeight: '14px',
        padding: '0 4px',
        borderRadius: 5,
        border: '1px solid var(--dsw-alias-border-l1)',
        color: 'var(--dsw-alias-label-secondary)',
      },
      /** The 16px cell the shipped Session row reserves for its state dot. */
      markCell: {
        position: 'relative',
        flex: '0 0 auto',
        boxSizing: 'border-box',
        width: 16,
        height: 16,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      },
      /** The shipped `StateDot`: one small round dot whose colour is the state. */
      markDot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'currentColor',
        transition: 'background 120ms ease',
      },
      markCorner: {
        position: 'absolute',
        right: -1,
        bottom: -1,
        width: 7,
        height: 7,
        boxSizing: 'border-box',
        borderRadius: '50%',
        border: '1px solid var(--dsw-alias-bg-layer-1)',
      },
      /** Live-session spinner: the conventional loading ring, not a pulsing dot. */
      sideSpinner: {
        width: 13,
        height: 13,
        boxSizing: 'border-box',
        borderRadius: '50%',
        borderStyle: 'solid',
        borderWidth: 1.75,
        borderColor: 'var(--dsw-alias-border-l2)',
        borderTopColor: 'var(--dsw-alias-brand-primary)',
        borderRightColor: 'var(--dsw-alias-brand-primary)',
        animation: 'dsh-projects-spin 1200ms linear infinite',
      },
      groupDot: { flex: '0 0 auto', width: 8, height: 8, borderRadius: 3 },
      runningChip: {
        flex: '0 0 auto',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '0 5px',
        borderRadius: 999,
        border: '1px solid var(--dsw-alias-border-l1)',
        fontSize: 10,
        lineHeight: '14px',
        color: 'var(--dsw-alias-label-secondary)',
      },
      runningDot: {
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: 'var(--dsw-alias-state-success-primary)',
        animation: 'dsh-projects-pulse 1.4s ease-in-out infinite',
      },
      stateTag: { flex: '0 0 auto', fontSize: 10, lineHeight: '14px' },
      sessionTitle: {
        flex: '1 1 auto',
        minWidth: 0,
        fontSize: 12,
        lineHeight: '18px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      time: { flex: '0 0 auto', fontSize: 10, lineHeight: '14px', color: 'var(--dsw-alias-label-secondary)' },
      rowMenuButton: {
        flex: '0 0 auto',
        width: 16,
        height: 16,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 4,
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: 12,
        lineHeight: 1,
        cursor: 'pointer',
      },
      menuPanel: {
        position: 'fixed',
        zIndex: 70,
        minWidth: 172,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        borderRadius: 8,
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-overlay)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
      },
      menuItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        width: '100%',
        padding: '5px 8px',
        border: '1px solid transparent',
        borderRadius: 6,
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: 12,
        lineHeight: '16px',
        textAlign: 'left',
        cursor: 'pointer',
      },
      emptyRow: { padding: '6px 10px 8px', fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' },
      menuSep: { height: 1, margin: '4px 2px', background: 'var(--dsw-alias-border-l1)' },
      dialogOverlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 17, 21, 0.32)',
      },
      dialogPanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 320,
        maxWidth: '90vw',
        padding: 16,
        borderRadius: 12,
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-overlay)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.32)',
      },
      dialogTitle: { fontSize: 13, lineHeight: '20px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' },
      dialogInput: {
        width: '100%',
        boxSizing: 'border-box',
        height: 32,
        padding: '0 10px',
        fontSize: 13,
        lineHeight: '20px',
        color: 'var(--dsw-alias-label-primary)',
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        outline: 'none',
      },
      dialogError: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-state-error-primary)' },
      dialogActions: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingTop: 2 },
      dialogButton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 28,
        padding: '0 12px',
        fontSize: 12,
        lineHeight: '16px',
        fontFamily: 'inherit',
        color: 'var(--dsw-alias-label-primary)',
        background: 'transparent',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        cursor: 'pointer',
      },
      dialogPrimary: {
        color: '#ffffff',
        background: 'var(--dsw-static-deepseek-500, #4176e6)',
        border: '1px solid transparent',
        fontWeight: 600,
      },
      toastLayer: {
        position: 'fixed',
        right: 14,
        bottom: 16,
        zIndex: 95,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 320,
        maxWidth: '40vw',
      },
      toast: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-overlay)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
        animation: 'dsh-projects-toast-in 160ms ease-out',
      },
      toastDot: {
        flex: '0 0 auto',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--dsw-alias-state-success-primary)',
      },
      toastBody: { display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, flex: '1 1 auto' },
      toastTitle: { fontSize: 12, lineHeight: '16px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' },
      toastText: {
        fontSize: 12,
        lineHeight: '17px',
        color: 'var(--dsw-alias-label-secondary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      toastOpen: {
        flex: '0 0 auto',
        height: 22,
        padding: '0 8px',
        fontSize: 11,
        lineHeight: '14px',
        fontFamily: 'inherit',
        color: '#ffffff',
        background: 'var(--dsw-static-deepseek-500, #4176e6)',
        border: '1px solid transparent',
        borderRadius: 6,
        cursor: 'pointer',
      },
      toastClose: {
        flex: '0 0 auto',
        width: 20,
        height: 20,
        padding: 0,
        fontSize: 13,
        lineHeight: '16px',
        fontFamily: 'inherit',
        color: 'var(--dsw-alias-label-secondary)',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 6,
        cursor: 'pointer',
      },
      menuGroup: {
        padding: '6px 8px 2px',
        fontSize: 10,
        lineHeight: '14px',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--dsw-alias-label-secondary)',
      },
      menuItemOn: { color: 'var(--dsw-static-deepseek-500, #4176e6)', fontWeight: 600 },
      menuScroll: { display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 340, overflowY: 'auto' },
      rail: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 0' },
      railButton: {
        width: 30,
        height: 30,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        fontFamily: 'inherit',
        fontSize: 12,
        cursor: 'pointer',
      },
      badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        maxWidth: 360,
        height: 22,
        padding: '0 8px',
        fontSize: 11,
        lineHeight: '16px',
        borderRadius: 999,
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-2)',
        color: 'var(--dsw-alias-label-secondary)',
        fontFamily: 'inherit',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    }

    /** One shared registry snapshot: the tree, the page and the badge read it. */
    function createProjectsStore(fetchProjects) {
      let snapshot = { status: 'idle', projects: [], assignments: {}, error: null }
      const listeners = new Set()
      let pending = null
      const publish = (next) => {
        snapshot = next
        for (const listener of [...listeners]) listener()
      }
      return {
        getSnapshot: () => snapshot,
        subscribe(listener) {
          listeners.add(listener)
          return () => {
            listeners.delete(listener)
          }
        },
        refresh() {
          if (pending !== null) return pending
          if (snapshot.status !== 'ready') publish({ ...snapshot, status: 'loading' })
          pending = fetchProjects()
            .then((value) => {
              publish({
                status: 'ready',
                projects: Array.isArray(value?.projects) ? value.projects : [],
                assignments: value?.assignments !== null && typeof value?.assignments === 'object' ? value.assignments : {},
                error: null,
              })
            })
            .catch((failure) => {
              publish({ status: 'error', projects: snapshot.projects, assignments: snapshot.assignments ?? {}, error: messageOf(failure) })
            })
            .finally(() => {
              pending = null
            })
          return pending
        },
      }
    }

    /** Render-time subscription to one snapshot store. */
    function useSnapshot(store) {
      const [value, setValue] = React.useState(store.getSnapshot)
      React.useEffect(
        () => store.subscribe(() => setValue(store.getSnapshot())),
        [store],
      )
      return value
    }

    /** Final path segment, for labels. */
    function baseName(path) {
      const trimmed = String(path ?? '').replace(/[\\/]+$/, '')
      const cut = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
      return cut === -1 ? trimmed : trimmed.slice(cut + 1) || trimmed
    }

    /** True when `path` is `folder` itself or lies beneath it. */
    function pathInside(folder, path) {
      const root = pathKey(folder)
      const value = pathKey(path)
      if (root === '' || value === '') return false
      return value === root || value.startsWith(`${root}/`)
    }

    /** The deepest project folder containing `path`, with its project. */
    function projectAt(projects, path) {
      const value = pathKey(path)
      if (value === '') return null
      let best = null
      for (const project of projects) {
        const primary = project.primaryPath
        const folders = Array.isArray(project.folders) ? project.folders : []
        for (const folder of [primary, ...folders]) {
          if (typeof folder !== 'string' || folder === '' || !pathInside(folder, value)) continue
          if (best === null || pathKey(folder).length > pathKey(best.folder).length) {
            best = { project, folder, primary: pathKey(folder) === pathKey(primary) }
          }
        }
      }
      return best
    }

    /**
     * Where the tree shows one session: the project folder the user filed it
     * under by hand, otherwise the deepest folder containing its cwd. A filing
     * changes only the tree — the session keeps its own working directory.
     */
    function filingOf(projects, assignments, sessionId, cwd) {
      const filed = assignments === undefined || assignments === null ? undefined : assignments[sessionId]
      if (filed !== undefined && filed !== null && typeof filed === 'object') {
        const project = projects.find((candidate) => candidate.id === filed.projectId)
        const folder = typeof filed.folder === 'string' ? filed.folder : ''
        /** A filing only counts while that folder is still one of the project's. */
        const stillListed =
          project !== undefined &&
          folder !== '' &&
          [project.primaryPath, ...(Array.isArray(project.folders) ? project.folders : [])].some(
            (candidate) => pathKey(candidate) === pathKey(folder),
          )
        if (stillListed === true) {
          return {
            project,
            folder,
            primary: pathKey(folder) === pathKey(project.primaryPath),
            filed: true,
          }
        }
      }
      const hit = projectAt(projects, cwd)
      return hit === null ? null : { ...hit, filed: false }
    }

    /** Compact recency label. */
    function recency(time, t) {
      if (typeof time !== 'number' || Number.isFinite(time) === false) return ''
      const delta = Date.now() - time
      if (delta < 60_000) return t('justNow')
      if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m`
      if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h`
      if (delta < 30 * 86_400_000) return `${Math.floor(delta / 86_400_000)}d`
      return new Date(time).toLocaleDateString()
    }

    /**
     * Keyframes for the live-state marks. Scoped names, rendered as a React
     * element inside the region so disposal removes them with the tree.
     */
    const SIDE_KEYFRAMES = [
      '@keyframes dsh-projects-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
      '@keyframes dsh-projects-pulse{0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}',
      '@keyframes dsh-projects-toast-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    ].join('')

    /**
     * Hues a project may take. Red (0-20), crimson (335-360) and the amber
     * warning band (20-55) are left out on purpose: red belongs to failures and
     * amber to "needs you", so a project tint must never read as either. Every
     * entry is a calm, mutually distinguishable hue.
     */
    const PROJECT_HUES = [210, 190, 168, 145, 118, 88, 62, 275, 300, 326, 246, 222]

    /** Stable, non-alarming hue per project, so a project keeps its colour. */
    function projectHue(seed) {
      const text = String(seed ?? '')
      let hash = 0
      for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) % 3600
      }
      return PROJECT_HUES[hash % PROJECT_HUES.length]
    }

    /** Tile colours for one hue; `null` means "no project" and stays neutral. */
    function hueColors(hue) {
      if (hue === null || hue === undefined) {
        return {
          accent: 'var(--dsw-alias-label-secondary)',
          tint: 'var(--dsw-alias-bg-layer-2)',
          ring: 'var(--dsw-alias-border-l2)',
        }
      }
      return {
        accent: `hsl(${hue} 70% 52%)`,
        tint: `hsl(${hue} 70% 52% / 0.16)`,
        ring: `hsl(${hue} 70% 52% / 0.55)`,
      }
    }

    /**
     * The ten colours a project may be painted with. Red is deliberately absent:
     * red stays reserved for failures, so a project tint never reads as an error.
     */
    const PROJECT_PALETTE = [
      '#3b82f6',
      '#6366f1',
      '#8b5cf6',
      '#d946ef',
      '#ec4899',
      '#06b6d4',
      '#14b8a6',
      '#22c55e',
      '#eab308',
      '#f97316',
    ]

    /** A project's identity colour: its own choice, else a stable derived hue. */
    function projectColorOf(project) {
      if (project !== null && project !== undefined && typeof project.color === 'string' && project.color !== '') {
        return project.color
      }
      return hueColors(project === null || project === undefined ? null : projectHue(project.id)).accent
    }

    /** Folder outline used by the "additional folder" chip, so it reads as a place. */
    function FolderGlyph() {
      return h(
        'svg',
        { width: 10, height: 10, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', {
          d: 'M1.9 4.5a1.3 1.3 0 0 1 1.3-1.3h2.7l1.4 1.7h5.5a1.3 1.3 0 0 1 1.3 1.3v5.3a1.3 1.3 0 0 1-1.3 1.3H3.2a1.3 1.3 0 0 1-1.3-1.3z',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinejoin: 'round',
        }),
      )
    }

    /**
     * Leading state mark of a session row. A session whose turn is running shows
     * the conventional loading ring (the same vocabulary as "fetching", not a
     * pulsing dot); every other state is the shipped round dot: amber while the
     * turn waits on the user, green for an unread completion, neutral when
     * settled. A blank draft row draws nothing, exactly like the shipped row.
     * A turn blocked on the user additionally carries the amber corner badge.
     */
    function SessionMark(props) {
      const { running, pending, completed, blank, hint } = props
      const waiting = pending !== null && pending !== undefined
      const state =
        waiting === true
          ? 'pending'
          : running === true
            ? 'running'
            : blank === true
              ? 'blank'
              : completed === true
                ? 'done'
                : 'idle'
      const dot =
        state === 'pending'
          ? 'var(--dsw-alias-state-warn-primary)'
          : state === 'done'
            ? 'var(--dsw-alias-state-success-primary)'
            : 'var(--dsw-alias-state-idle-primary)'
      /** Pulsing amber badge: the turn cannot continue until the user answers. */
      const corner =
        waiting === true
          ? h('span', {
              key: 'corner',
              'data-corner': 'waiting',
              style: {
                ...sideStyles.markCorner,
                background: 'var(--dsw-alias-state-warn-primary)',
                animation: 'dsh-projects-pulse 1.4s ease-in-out infinite',
              },
            })
          : null
      const body =
        state === 'blank'
          ? null
          : state === 'running'
            ? h('span', { key: 'spinner', 'data-spinner': 'running', style: sideStyles.sideSpinner })
            : h('span', { key: 'dot', style: { ...sideStyles.markDot, background: dot } })
      return h(
        'span',
        { title: hint, 'aria-hidden': true, 'data-mark': state, style: sideStyles.markCell },
        body,
        corner,
      )
    }

    /**
     * Containment boundary for the region: a thrown render keeps the sidebar
     * usable and tells the user how to get the shipped list back.
     */
    class SectionBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }

      static getDerivedStateFromError(error) {
        return { error }
      }

      componentDidCatch(error) {
        console.error('[dsh-projects] sidebar region failed:', error)
      }

      render() {
        if (this.state.error !== null) return h('div', { style: sideStyles.emptyRow }, this.props.fallback)
        return this.props.children
      }
    }

    /** Disclosure row shared by project groups and the ungrouped bucket. */
    function GroupHead(props) {
      const { label, count, expanded, title, onToggle, color, running, runningLabel, extra } = props
      return h(
        'div',
        { style: sideStyles.groupHead },
        h(
          'button',
          {
            type: 'button',
            style: sideStyles.disclosure,
            'aria-expanded': expanded,
            title,
            onClick: onToggle,
          },
          h('span', { style: { ...sideStyles.caret, transform: expanded ? 'rotate(90deg)' : 'none' } }, '›'),
          h('span', { style: { ...sideStyles.groupDot, background: color === null || color === undefined ? 'var(--dsw-alias-label-secondary)' : color } }),
          h('span', { style: sideStyles.groupTitle }, label),
          running > 0
            ? h(
                'span',
                { style: sideStyles.runningChip, title: runningLabel },
                h('span', { style: sideStyles.runningDot }),
                String(running),
              )
            : null,
          h('span', { style: sideStyles.count }, String(count)),
        ),
        ...extra,
      )
    }

    /** Star used by the pinned bucket inside a project. */
    function PinGlyph() {
      return h(
        'svg',
        { width: 10, height: 10, viewBox: '0 0 16 16', 'aria-hidden': true },
        h('path', {
          d: 'M8 1.8 9.9 5.7 14.2 6.3 11.1 9.3 11.8 13.6 8 11.6 4.2 13.6 4.9 9.3 1.8 6.3 6.1 5.7z',
          fill: 'currentColor',
        }),
      )
    }

    /**
     * bucket. Sessions of a folder hang below their own folder, so a project
     * with several folders reads as project -> folder -> sessions.
     */
    function SectionHead(props) {
      const { label, count, expanded, title, onToggle, running, runningLabel, glyph, color } = props
      /** A section without a toggle (the global pinned block) is always open. */
      const fixed = onToggle === undefined || onToggle === null
      const cells = [
        fixed
          ? null
          : h('span', { key: 'caret', style: { ...sideStyles.caret, transform: expanded ? 'rotate(90deg)' : 'none' } }, '›'),
        glyph === undefined || glyph === null ? null : h('span', { key: 'glyph', style: sideStyles.sectionGlyph }, glyph),
        color === undefined || color === null || color === ''
          ? null
          : h('span', {
              key: 'color',
              'data-section-color': color,
              style: { ...sideStyles.sectionDot, background: color },
            }),
        h('span', { key: 'label', style: sideStyles.sectionTitle }, label),
        running > 0
          ? h(
              'span',
              { key: 'running', style: sideStyles.runningChip, title: runningLabel },
              h('span', { style: sideStyles.runningDot }),
              String(running),
            )
          : null,
        h('span', { key: 'count', style: sideStyles.count }, String(count)),
      ]
      if (fixed) {
        return h(
          'div',
          { style: sideStyles.sectionHead, 'data-static-section': 'true' },
          h('div', { style: sideStyles.sectionDisclosure, title }, cells),
        )
      }
      return h(
        'div',
        { style: sideStyles.sectionHead },
        h(
          'button',
          {
            type: 'button',
            style: sideStyles.sectionDisclosure,
            'aria-expanded': expanded,
            title,
            onClick: onToggle,
          },
          cells,
        ),
      )
    }

    /**
     * One Session's action menu — the shipped rows (Pin, Rename, Fork, Archive
     * and Copy Session ID) come back through the browsing region's own
     * `sidebar.workspaces.session.menu.item` list: this plugin hosts that list
     * instead of reimplementing the actions, so the rows keep their labels,
     * dialogs and shortcuts. Should the host not hand over that renderer, rows
     * that perform the same service calls are drawn here instead, so archive,
     * fork and friends never disappear.
     */
    function SessionMenu(props) {
      const { t, sessionId, displayTitle, x, y, renderSlot, onOpen, onRename, onClose, actions, pinned, archived, projects, assignments } = props
      const [mode, setMode] = React.useState('menu')
      const filedFolder = assignments?.[sessionId]?.folder ?? null
      const viewportWidth = typeof window !== 'undefined' && Number.isFinite(window.innerWidth) ? window.innerWidth : 1024
      const viewportHeight = typeof window !== 'undefined' && Number.isFinite(window.innerHeight) ? window.innerHeight : 768
      const left = Math.max(8, Math.min(x, viewportWidth - 188))
      const top = Math.max(8, Math.min(y, viewportHeight - 232))
      const menuOpenState = [
        true,
        (value) => {
          if (value !== true) onClose()
        },
      ]
      /** One row of the fallback menu: a service call that dismisses the menu. */
      const row = (key, label, run) =>
        h(
          'button',
          {
            key,
            type: 'button',
            role: 'menuitem',
            style: sideStyles.menuItem,
            onClick: () => {
              onClose()
              try {
                run()
              } catch (failure) {
                console.error('[dsh-projects] session action failed:', failure)
              }
            },
          },
          label,
        )
      const fallback = [
        row('pin', pinned === true ? t('unpin') : t('pin'), () => (pinned === true ? actions.unpin(sessionId) : actions.pin(sessionId))),
        row('rename', t('sideRename'), () => onRename(sessionId, displayTitle)),
        row('archive', archived === true ? t('unarchive') : t('archive'), () =>
          archived === true ? actions.unarchive(sessionId) : actions.archive(sessionId),
        ),
        row('fork', t('fork'), () => actions.fork(sessionId)),
        row('copy', t('sideCopyId'), () => actions.copyId(sessionId)),
        row('open', t('open'), () => onOpen(sessionId)),
      ]
      const hosted =
        typeof renderSlot === 'function'
          ? renderSlot('sidebar.workspaces.session.menu.item', { sessionId, displayTitle }, { hookContext: menuOpenState })
          : null
      const hostedRows = Array.isArray(hosted)
        ? hosted.filter((item) => item !== null && item !== undefined && item !== false)
        : []
      const items = hostedRows.length > 0 ? hostedRows : fallback
      const closeMenu = (event) => {
        if (event !== undefined) event.stopPropagation()
        onClose()
      }
      if (mode === 'move') {
        const groups = []
        for (const project of Array.isArray(projects) ? projects : []) {
          groups.push(h('div', { key: `g-${project.id}`, style: sideStyles.menuGroup }, project.name))
          const folders = Array.isArray(project.folders) ? project.folders : []
          for (const folder of [project.primaryPath, ...folders]) {
            const isPrimary = pathKey(folder) === pathKey(project.primaryPath)
            const current = filedFolder !== null && pathKey(filedFolder) === pathKey(folder)
            groups.push(
              h(
                'button',
                {
                  key: `f-${project.id}-${folder}`,
                  type: 'button',
                  role: 'menuitem',
                  title: folder,
                  style: { ...sideStyles.menuItem, ...(current ? sideStyles.menuItemOn : null) },
                  onClick: (event) => {
                    event.stopPropagation()
                    onClose()
                    void actions.assign(sessionId, { projectId: project.id, folder })
                  },
                },
                isPrimary ? `${t('sidePrimaryShort')} · ${baseName(folder)}` : baseName(folder),
              ),
            )
          }
        }
        /** Back to the session's own workspace: drop any manual filing. */
        groups.push(h('div', { key: 'default-sep', style: sideStyles.menuSep }))
        groups.push(
          h(
            'button',
            {
              key: 'default-workspace',
              type: 'button',
              role: 'menuitem',
              'data-move-default': 'true',
              title: t('sideMoveDefaultHint'),
              style: { ...sideStyles.menuItem, ...(filedFolder === null ? sideStyles.menuItemOn : null) },
              onClick: (event) => {
                event.stopPropagation()
                onClose()
                void actions.assign(sessionId, { projectId: '', folder: '' })
              },
            },
            t('sideMoveDefault'),
          ),
        )
        return h(
          'div',
          {
            role: 'menu',
            'data-session-menu': sessionId,
            'data-session-menu-mode': 'move',
            style: { ...sideStyles.menuPanel, left, top, minWidth: 208 },
            onPointerDown: (event) => event.stopPropagation(),
            onContextMenu: (event) => event.preventDefault(),
            onClick: onClose,
          },
          h(
            'button',
            {
              key: 'back',
              type: 'button',
              role: 'menuitem',
              style: sideStyles.menuItem,
              onClick: (event) => {
                event.stopPropagation()
                setMode('menu')
              },
            },
            `← ${t('sideMove')}`,
          ),
          h('div', { key: 'sep', style: sideStyles.menuSep }),
          h(
            'div',
            { key: 'targets', style: sideStyles.menuScroll },
            groups.length === 0 ? h('div', { key: 'none', style: sideStyles.emptyRow }, t('sideNoTargets')) : groups,
          ),
        )
      }
      return h(
        'div',
        {
          role: 'menu',
          'data-session-menu': sessionId,
          style: { ...sideStyles.menuPanel, left, top },
          onPointerDown: (event) => event.stopPropagation(),
          onContextMenu: (event) => event.preventDefault(),
          onClick: onClose,
        },
        items,
        h('div', { key: 'sep', style: sideStyles.menuSep }),
        h(
          'button',
          {
            key: 'move',
            type: 'button',
            role: 'menuitem',
            'data-session-move': sessionId,
            style: sideStyles.menuItem,
            onClick: (event) => {
              event.stopPropagation()
              setMode('move')
            },
          },
          t('sideMove'),
        ),
      )
    }

    /**
     * Inline rename dialog for one Session: Enter saves, Escape cancels, and the
     * field starts with the current title. It exists because the shipped menu
     * row cannot be relied on: when the slot host yields no rows this plugin
     * draws the menu itself, so rename must stay reachable from here too.
     */
    function SessionRenameDialog(props) {
      const { t, sessionId, value, busy, error, onCancel, onSubmit } = props
      const [draft, setDraft] = React.useState(value ?? '')
      const submit = () => {
        const next = String(draft ?? '').trim()
        if (next === '' || busy === true) return
        onSubmit(next)
      }
      return h(
        'div',
        {
          style: sideStyles.dialogOverlay,
          onPointerDown: (event) => {
            if (event.target === event.currentTarget) onCancel()
          },
        },
        h(
          'div',
          {
            role: 'dialog',
            'aria-modal': 'true',
            'data-session-rename': sessionId,
            style: sideStyles.dialogPanel,
          },
          h('div', { style: sideStyles.dialogTitle }, t('sideRenameTitle')),
          h('input', {
            type: 'text',
            style: sideStyles.dialogInput,
            value: draft,
            autoFocus: true,
            spellCheck: false,
            onChange: (event) => setDraft(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                onCancel()
              }
            },
          }),
          error === '' || error === undefined ? null : h('div', { style: sideStyles.dialogError }, error),
          h(
            'div',
            { style: sideStyles.dialogActions },
            h('button', { type: 'button', style: sideStyles.dialogButton, onClick: onCancel }, t('cancel')),
            h(
              'button',
              {
                type: 'button',
                style: { ...sideStyles.dialogButton, ...sideStyles.dialogPrimary },
                disabled: busy === true,
                onClick: submit,
              },
              t('save'),
            ),
          ),
        ),
      )
    }

    /**
     * Small floating notices for sessions that just stopped running. Each one
     * names the session and opens it on click; auto-dismissal is handled by the
     * caller's timers so the layer itself stays stateless.
     */
    function SessionToasts(props) {
      const { t, toasts, onOpen, onDismiss } = props
      if (toasts.length === 0) return null
      return h(
        'div',
        { style: sideStyles.toastLayer, 'data-session-toasts': String(toasts.length) },
        toasts.map((toast) =>
          h(
            'div',
            { key: toast.key, role: 'status', style: sideStyles.toast },
            h('span', { style: sideStyles.toastDot }),
            h(
              'span',
              { style: sideStyles.toastBody },
              h('span', { style: sideStyles.toastTitle }, toast.id === '' ? t('sideNotice') : t('toastDone')),
              h('span', { style: sideStyles.toastText, title: toast.title }, toast.title),
            ),
            toast.id === ''
              ? null
              : h(
                  'button',
                  {
                    type: 'button',
                    style: sideStyles.toastOpen,
                'data-toast-open': toast.id,
                onClick: () => {
                  onDismiss(toast.key)
                  onOpen(toast.id)
                },
              },
              t('open'),
            ),
            h(
              'button',
              {
                type: 'button',
                style: sideStyles.toastClose,
                'aria-label': t('cancel'),
                onClick: () => onDismiss(toast.key),
              },
              '×',
            ),
          ),
        ),
      )
    }

    /** Session rows of one group; each row names the folder it runs in. */
    function SessionRows(props) {
      const { t, entries, activeId, onOpen, onMenu } = props
      const [hovered, setHovered] = React.useState(null)
      if (entries.length === 0) return h('div', { style: sideStyles.emptyRow }, t('sideNoSessions'))
      return h(
        'div',
        { style: sideStyles.rows },
        entries.map((entry) => {
          const { row, folder, primary, filed, running, pending, completed, pinned } = entry
          const active = row.id === activeId
          const title = row.blank === true ? t('sideNewSession') : row.displayTitle ?? row.title ?? row.id
          const state =
            running === true
              ? { label: t('sideRunning'), color: 'var(--dsw-alias-state-success-primary)' }
              : pending !== null && pending !== undefined
                ? { label: t('sideWaiting'), color: 'var(--dsw-alias-state-warn-primary)' }
                : null
          const tooltip = [
            title,
            folder === null ? '' : `${t('sideFolder')}: ${folder}`,
            filed === true ? `${t('sideFiledHint')}: ${row.cwd ?? ''}` : '',
            row.cwd ?? '',
            state === null ? '' : state.label,
          ]
            .filter((part) => part !== '')
            .join('\n')
          return h(
            'div',
            {
              key: row.id,
              role: 'button',
              tabIndex: 0,
              title: tooltip,
              'data-session-id': row.id,
              'data-active': active ? 'true' : 'false',
              'data-pinned': pinned === true ? 'true' : 'false',
              onClick: () => onOpen(row.id),
              onContextMenu: (event) => {
                event.preventDefault()
                event.stopPropagation()
                if (typeof onMenu !== 'function') return
                onMenu(row.id, title, event.clientX ?? 0, event.clientY ?? 0)
              },
              onMouseEnter: () => setHovered(row.id),
              onMouseLeave: () => setHovered((current) => (current === row.id ? null : current)),
              onKeyDown: (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                onOpen(row.id)
              },
              style: {
                ...sideStyles.sessionRow,
                ...(active
                  ? sideStyles.sessionRowActive
                  : hovered === row.id
                    ? sideStyles.sessionRowHover
                    : null),
              },
            },
            h(SessionMark, {
              running,
              pending,
              completed,
              blank: row.blank === true,
              hint: tooltip,
            }),
            h(
              'span',
              {
                style: {
                  ...sideStyles.sessionTitle,
                  ...(active
                    ? sideStyles.sessionTitleActive
                    : pinned === true
                      ? sideStyles.sessionTitlePinned
                      : null),
                },
              },
              title,
            ),
            /**
             * Pinned rows sit outside their folder section, so they name the
             * directory they belong to: the project folder when they have one,
             * otherwise their own workspace path.
             */
            pinned === true && (folder !== null || typeof row.cwd === 'string')
              ? h(
                  'span',
                  {
                    key: 'folder',
                    style: sideStyles.pinFolder,
                    title: folder !== null ? folder : row.cwd,
                    'data-pin-folder': 'true',
                  },
                  folder !== null && primary === true
                    ? `${t('sidePrimaryShort')} · ${baseName(folder)}`
                    : baseName(folder !== null ? folder : row.cwd),
                )
              : null,
            h(
              'button',
              {
                key: 'menu',
                type: 'button',
                style: sideStyles.rowMenuButton,
                title: t('sideMore'),
                'aria-haspopup': 'menu',
                onClick: (event) => {
                  event.stopPropagation()
                  if (typeof onMenu !== 'function') return
                  const box = event.currentTarget.getBoundingClientRect()
                  onMenu(row.id, title, box.right - 172, box.bottom + 4)
                },
              },
              '⋯',
            ),
            state === null
              ? h('span', { style: sideStyles.time }, recency(row.updatedAt, t))
              : h(
                  'span',
                  {
                    style: { ...sideStyles.stateTag, color: state.color, animation: 'dsh-projects-pulse 1.8s ease-in-out infinite' },
                  },
                  state.label,
                ),
          )
        }),
      )
    }

    /** Whether the window is in front. Desktop notices exist for the background. */
    function appInForeground() {
      if (typeof document === 'undefined') return true
      if (typeof document.hasFocus === 'function') return document.hasFocus() === true
      if (document.visibilityState === 'hidden') return false
      return true
    }

    /** How long one completion dialog stays on screen before closing itself. */
    const COMPLETION_DIALOG_TTL_MS = 60_000

    /** Cap on simultaneous dialogs; the oldest falls off the top. */
    const COMPLETION_DIALOG_MAX = 5

    /** Desktop notifications still on screen, so each click can close its own. */
    const liveNotices = []

    /**
     * A session whose notice was clicked while the window was hidden. The
     * renderer cannot raise an Electron window, so the click records the session
     * here and the region opens it the moment the window is shown again.
     */
    let pendingOpenSession = null

    /**
     * One operating-system notification for a finished reply. It is raised even
     * when the window is in front (a ready reply always deserves the notice) and
     * closes itself after `ttlMs`. Clicking it opens the session and closes it
     * early. Returns false when the platform cannot show one, so the caller can
     * fall back to the in-app dialog.
     */
    function showDesktopNotice(target, notice, onOpen, ttlMs) {
      const Ctor = globalThis.Notification
      if (typeof Ctor !== 'function') return false
      if (Ctor.permission === 'denied') return false
      if (Ctor.permission !== 'granted') {
        try {
          const pending = typeof Ctor.requestPermission === 'function' ? Ctor.requestPermission() : undefined
          if (pending !== undefined && typeof pending.catch === 'function') pending.catch(() => {})
        } catch {}
        return false
      }
      try {
        const shown = new Ctor(target, { body: notice.title, tag: notice.id, silent: false })
        liveNotices.push(shown)
        let closed = false
        const forget = () => {
          const at = liveNotices.indexOf(shown)
          if (at !== -1) liveNotices.splice(at, 1)
        }
        const retire = () => {
          if (closed === true) return
          closed = true
          forget()
          try {
            if (typeof shown.close === 'function') shown.close()
          } catch {}
        }
        const timer = setTimeout(retire, ttlMs)
        shown.onclose = () => {
          clearTimeout(timer)
          forget()
        }
        /** One click, however the platform delivers it (property or listener). */
        let fired = false
        const activate = () => {
          if (fired === true) return
          fired = true
          clearTimeout(timer)
          retire()
          /** A hidden window cannot be raised from here: keep the session id. */
          if (notice.id !== '' && appInForeground() !== true) pendingOpenSession = notice.id
          onOpen(notice.id)
          try {
            if (typeof window !== 'undefined' && typeof window.focus === 'function') window.focus()
          } catch {}
        }
        shown.onclick = activate
        if (typeof shown.addEventListener === 'function') shown.addEventListener('click', activate)
        return true
      } catch {
        return false
      }
    }

    /**
     * Best-effort desktop notice for one finished reply. The renderer's web
     * Notification API is the working path in the desktop shell (the Host is a
     * Node-mode process and cannot raise Electron notifications), and the in-app
     * dialog is the last resort so a reply is never lost. Returns true when an
     * operating-system notice was raised, which means no dialog is drawn on top.
     */
    function raiseDesktopNotice(target, notice, onOpen) {
      return showDesktopNotice(target, notice, onOpen, COMPLETION_DIALOG_TTL_MS) === true
    }

        /** Status fallback for hosts that do not hand the hook over: one hook, always. */
    function useNoSessionStatus() {
      const [value] = React.useState(null)
      return value
    }

    /** Last live state per session, used only to detect finish edges. */
    const lastLiveState = new Map()

    /**
     * One-shot feedback for menu actions (filing a session, failures). The menu
     * closes on pick, so the result is shown as a short notice instead.
     */
    const actionFeedback = {
      listeners: new Set(),
      emit(text) {
        for (const listener of [...this.listeners]) listener(text)
      },
    }

    /** The sidebar region: project tree first, then everything unmatched. */
    function ProjectsBrowser(props) {
      const { t, wide, expandSidebar, useSessions, useWorkspaces, useSessionStatus, store, start, manage, open, call, renderSlot, actions } = props
      const snapshot = useSnapshot(store)
      const sessions = useSessions((state) => state)
      const workspaces = useWorkspaces((state) => state)
      const readStatuses =
        typeof useSessionStatus === 'function' ? useSessionStatus : useNoSessionStatus
      const statuses = readStatuses((state) => state)
      const [showArchived, setShowArchived] = React.useState(false)
      const [collapsed, setCollapsed] = React.useState({})
      const [busy, setBusy] = React.useState(null)
      const [menu, setMenu] = React.useState(null)
      const [rename, setRename] = React.useState(null)
      const [toasts, setToasts] = React.useState([])

      React.useEffect(() => {
        void store.refresh()
      }, [store])

      React.useEffect(() => {
        if (menu === null) return undefined
        const close = () => setMenu(null)
        const onKey = (event) => {
          if (event.key === 'Escape') close()
        }
        if (typeof document === 'undefined') return undefined
        document.addEventListener('pointerdown', close)
        document.addEventListener('keydown', onKey)
        return () => {
          document.removeEventListener('pointerdown', close)
          document.removeEventListener('keydown', onKey)
        }
      }, [menu])

      /**
       * A finished reply always asks for attention, window in front or not: the
       * OS notification is raised first (it reaches the desktop even when the app
       * is minimised) and closes itself after one minute; the in-app dialog is the
       * fallback when the platform refuses notifications. Clicking either one
       * opens that session.
       *
       * Edge detection lives in a module-level map instead of component state, so
       * a host re-render cannot lose it, and a mount only records a baseline
       * instead of replaying sessions that finished long ago.
       */
      React.useEffect(() => {
        const byId = sessions?.byId ?? {}
        const statusOf = (id) => (typeof statuses?.get === 'function' ? statuses.get(id) : undefined)
        let currentSessionId = null
        for (const id of Object.keys(byId)) {
          if (((byId[id]?.retainedBy?.mainView) ?? 0) > 0) {
            currentSessionId = id
            break
          }
        }
        const firstPass = lastLiveState.size === 0
        const finished = []
        for (const id of Object.keys(byId)) {
          const row = byId[id]
          const status = statusOf(id)
          const running = (status?.running ?? row?.running) === true
          const completed = status?.completionUnread === true
          const previous = lastLiveState.get(id)
          lastLiveState.set(id, { running, completed })
          if (firstPass === true || previous === undefined) continue
          if (row === undefined || row === null || row.origin === 'subagent' || row.blank === true) continue
          if (completed === false) continue
          const leftRunning = previous.running === true && running === false
          const appearedCompleted = previous.completed === false
          if (leftRunning === false && appearedCompleted === false) continue
          /** The window is in front and the user is already looking at it. */
          if (id === currentSessionId && appInForeground() === true) continue
          finished.push({ key: `${id}:${Date.now()}:${finished.length}`, id, title: row.displayTitle ?? row.title ?? id })
        }
        if (finished.length === 0) return
        /**
         * The desktop notice is the notice; the in-app dialog only appears when
         * no operating-system notice could be raised, so one reply never yields
         * two dialogs.
         */
        for (const toast of finished) {
          const shown = raiseDesktopNotice(t('toastDone'), toast, (id) => openSessionRow(id))
          if (shown === true) continue
          setToasts((list) => [...list, toast].slice(-COMPLETION_DIALOG_MAX))
          setTimeout(() => setToasts((list) => list.filter((item) => item.key !== toast.key)), COMPLETION_DIALOG_TTL_MS)
        }
      }, [sessions, statuses])

      /** Short notice for a menu action whose result the closed menu cannot show. */
      React.useEffect(() => {
        const listener = (text) => {
          const key = `action:${Date.now()}:${Math.random()}`
          setToasts((list) => [...list, { key, id: '', title: text }].slice(-COMPLETION_DIALOG_MAX))
          setTimeout(() => setToasts((list) => list.filter((item) => item.key !== key)), 8000)
        }
        actionFeedback.listeners.add(listener)
        return () => {
          actionFeedback.listeners.delete(listener)
        }
      }, [])

      /**
       * A notice clicked while the window was hidden cannot raise the Electron
       * window; the id is waiting here, so showing the window again lands on that
       * session instead of leaving the user to find it.
       */
      React.useEffect(() => {
        const openPending = () => {
          if (pendingOpenSession === null) return
          const id = pendingOpenSession
          pendingOpenSession = null
          try {
            openSessionRow(id)
          } catch (failure) {
            console.error('[dsh-projects] open pending session failed:', failure)
          }
        }
        const onVisible = () => {
          if (document.visibilityState === 'visible' || document.hasFocus?.() === true) openPending()
        }
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
          window.addEventListener('focus', onVisible)
        }
        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
          document.addEventListener('visibilitychange', onVisible)
        }
        return () => {
          if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
            window.removeEventListener('focus', onVisible)
          }
          if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
            document.removeEventListener('visibilitychange', onVisible)
          }
        }
      }, [])

      const archived = React.useMemo(() => new Set(workspaces?.archivedSessionIds ?? []), [workspaces])
      const pinned = React.useMemo(() => new Set(workspaces?.pinnedSessionIds ?? []), [workspaces])
      const projects = snapshot.projects
      const assignments = snapshot.assignments ?? {}

      const currentId = React.useMemo(() => {
        const byId = sessions?.byId ?? {}
        for (const key of Object.keys(byId)) {
          if ((byId[key]?.retainedBy?.mainView ?? 0) > 0) return key
        }
        return null
      }, [sessions])

      const tree = React.useMemo(() => {
        const byId = sessions?.byId ?? {}
        const ids = Array.isArray(sessions?.ids) ? sessions.ids : []
        const rows = []
        for (const id of ids) {
          const row = byId[id]
          if (row === undefined || row === null) continue
          if (row.origin === 'subagent') continue
          if (row.blank === true && id !== currentId) continue
          if (showArchived !== true && archived.has(id)) continue
          rows.push(row)
        }
        rows.sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0))
        /** Live state of one session: running, waiting on the user, or done-unread. */
        const stateOf = (id) => {
          const status = typeof statuses?.get === 'function' ? statuses.get(id) : undefined
          const kind = status?.pendingInteraction?.kind
          const pending = kind === 'approval' || kind === 'plan-review' || kind === 'question' ? kind : null
          return {
            running: (status?.running ?? byId[id]?.running) === true,
            pending,
            completed: status?.completionUnread === true,
          }
        }
        const buckets = projects.map((project) => ({
          project,
          sections: [],
          count: 0,
          running: 0,
        }))
        const byProject = new Map(buckets.map((bucket) => [bucket.project.id, bucket]))
        const other = []
        /** Pinned rows lead the whole tree, above every project. */
        const topPinned = []
        for (const row of rows) {
          const hit = filingOf(projects, assignments, row.id, row.cwd)
          const state = stateOf(row.id)
          const isPinned = pinned.has(row.id)
          if (hit === null) {
            const entry = {
              row,
              folder: null,
              primary: false,
              filed: false,
              pinned: isPinned,
              ...state,
            }
            if (isPinned) {
              topPinned.push(entry)
              continue
            }
            other.push(entry)
            continue
          }
          const bucket = byProject.get(hit.project.id)
          if (bucket === undefined) continue
          const entry = {
            row,
            folder: hit.folder,
            primary: hit.primary,
            filed: hit.filed === true,
            color: projectColorOf(hit.project),
            pinned: isPinned,
            ...state,
          }
          /** Project counters describe the rows rendered under it (pinned rows
           * live in the global block, so they are counted there instead). */
          if (isPinned) {
            topPinned.push(entry)
            continue
          }
          bucket.count += 1
          if (state.running === true) bucket.running += 1
          let section = bucket.sections.find((candidate) => candidate.path === hit.folder)
          if (section === undefined) {
            section = { path: hit.folder, primary: hit.primary, color: projectColorOf(hit.project), entries: [] }
            bucket.sections.push(section)
          }
          section.entries.push(entry)
        }
        /** Pinning order wins, then recency, so the top block keeps meaning. */
        const pinOrder = new Map((workspaces?.pinnedSessionIds ?? []).map((id, index) => [id, index]))
        const pinRank = (entry) => (pinOrder.has(entry.row.id) ? pinOrder.get(entry.row.id) : Number.MAX_SAFE_INTEGER)
        topPinned.sort((left, right) => {
          const rank = pinRank(left) - pinRank(right)
          if (rank !== 0) return rank
          return (right.row.updatedAt ?? 0) - (left.row.updatedAt ?? 0)
        })
        for (const bucket of buckets) {
          /** Registered order: the primary workspace first, then the other folders. */
          const order = [bucket.project.primaryPath, ...(bucket.project.folders ?? [])]
          bucket.sections.sort((left, right) => order.indexOf(left.path) - order.indexOf(right.path))
        }
        /**
         * Sessions outside every project still get structure: pinned ones lead
         * the bucket, DSH's own workspace membership drives the sections below
         * them, and whatever belongs to no workspace at all trails as loose
         * rows.
         */
        const workspaceBySession = new Map()
        for (const item of workspaces?.items ?? []) {
          for (const sessionId of item.sessionIds ?? []) workspaceBySession.set(sessionId, item)
        }
        const otherSections = []
        const otherLoose = []
        for (const entry of other) {
          const item = workspaceBySession.get(entry.row.id)
          if (item === undefined) {
            otherLoose.push(entry)
            continue
          }
          let section = otherSections.find((candidate) => candidate.workspaceId === item.workspaceId)
          if (section === undefined) {
            section = { workspaceId: item.workspaceId, path: item.path, title: item.title, entries: [] }
            otherSections.push(section)
          }
          section.entries.push(entry)
        }
        /** Newest workspace first, matching how the rows themselves are ordered. */
        const newestOf = (entries) => entries.reduce((latest, entry) => Math.max(latest, entry.row.updatedAt ?? 0), 0)
        otherSections.sort((left, right) => newestOf(right.entries) - newestOf(left.entries))
        return { buckets, topPinned, other, otherSections, otherLoose }
      }, [sessions, projects, assignments, archived, currentId, showArchived, statuses, pinned, workspaces])

      /** Running sessions of one group, for its header chip. */
      const sectionRunning = (entries) => entries.filter((entry) => entry.running === true).length

      const toggle = (key) =>
        setCollapsed((current) => ({ ...current, [key]: current[key] !== true }))

      const openSessionRow = (sessionId) => {
        try {
          open(sessionId)
        } catch (failure) {
          console.error('[dsh-projects] open session failed:', failure)
        }
      }

      const newSession = (project) => {
        setBusy(project.id)
        Promise.resolve()
          .then(() => start(project))
          .catch((failure) => console.error('[dsh-projects] start session failed:', failure))
          .finally(() => setBusy(null))
      }

      /** Open one row's action menu at a viewport point (right-click or "..."). */
      const openMenu = (sessionId, displayTitle, x, y) => {
        setMenu({ sessionId, displayTitle, x, y })
      }

      if (wide !== true) {
        const names = projects.slice(0, 10)
        return h(
          SectionBoundary,
          { fallback: t('sideFailure') },
          [
            h(
              'div',
              { key: 'rail', style: sideStyles.rail },
              names.map((project) =>
                h(
                  'button',
                  {
                    key: project.id,
                    type: 'button',
                    style: sideStyles.railButton,
                    title: project.name,
                    onClick: () => {
                      if (typeof expandSidebar === 'function') expandSidebar()
                      manage()
                    },
                  },
                  String(project.name ?? '').slice(0, 1),
                ),
              ),
              h(
                'button',
                {
                  key: 'manage',
                  type: 'button',
                  style: sideStyles.railButton,
                  title: t('sideManage'),
                  onClick: manage,
                },
                '⚙',
              ),
            ),
            /** Notices are drawn in the rail too: they are fixed-position anyway. */
            h(SessionToasts, {
              key: 'toasts',
              t,
              toasts,
              onOpen: openSessionRow,
              onDismiss: (key) => setToasts((list) => list.filter((item) => item.key !== key)),
            }),
          ],
        )
      }

      return h(
        SectionBoundary,
        { fallback: t('sideFailure') },
        h(
          'div',
          { style: sideStyles.side },
          h('style', { key: 'keyframes' }, SIDE_KEYFRAMES),
          h(
            'div',
            { style: sideStyles.head },
            h('span', { style: sideStyles.headTitle }, `${t('sideProjects')} (${projects.length})`),
            h('button', { type: 'button', style: sideStyles.iconButton, title: t('sideNewProject'), onClick: manage }, '＋'),
            h(
              'button',
              {
                type: 'button',
                style: sideStyles.iconButton,
                title: showArchived === true ? t('sideHideArchived') : t('sideShowArchived'),
                onClick: () => setShowArchived((value) => value !== true),
              },
              showArchived === true ? '☑' : '☐',
            ),
          ),
          h(
            'div',
            { style: sideStyles.scroll },
            snapshot.status === 'error' ? h('div', { style: sideStyles.emptyRow }, snapshot.error ?? '') : null,
            snapshot.status !== 'error' && projects.length === 0
              ? h(
                  'div',
                  { style: sideStyles.emptyRow },
                  snapshot.status === 'loading' || snapshot.status === 'idle' ? t('loading') : t('sideEmpty'),
                )
              : null,
            tree.topPinned.length === 0
              ? null
              : h(
                  'div',
                  { key: '__topPinned', style: sideStyles.group },
                  h(SectionHead, {
                    label: t('sidePinned'),
                    count: tree.topPinned.length,
                    title: t('sidePinnedHint'),
                    running: sectionRunning(tree.topPinned),
                    runningLabel: t('sideRunning'),
                    glyph: h(PinGlyph),
                  }),
                  h(SessionRows, { t, entries: tree.topPinned, activeId: currentId, onOpen: openSessionRow, onMenu: openMenu }),
                ),
            tree.buckets.map(({ project, sections, count, running, color }) => {
              const expanded = collapsed[project.id] !== true
              const rowList = (entries) =>
                h(SessionRows, { t, entries, activeId: currentId, onOpen: openSessionRow, onMenu: openMenu })
              return h(
                'div',
                { key: project.id, style: sideStyles.group },
                h(GroupHead, {
                  label: project.name,
                  count,
                  expanded,
                  title: project.primaryPath,
                  onToggle: () => toggle(project.id),
                  color: projectColorOf(project),
                  running,
                  runningLabel: t('sideRunning'),
                  extra: [
                    h(
                      'button',
                      {
                        key: 'start',
                        type: 'button',
                        style: sideStyles.iconButton,
                        title: t('sideNewSession'),
                        disabled: busy === project.id,
                        onClick: () => newSession(project),
                      },
                      busy === project.id ? '…' : '＋',
                    ),
                    h(
                      'button',
                      { key: 'manage', type: 'button', style: sideStyles.iconButton, title: t('sideManage'), onClick: manage },
                      '⚙',
                    ),
                  ],
                }),
                expanded !== true
                  ? null
                  : [
                      ...sections.map((section) => {
                        const key = `f:${project.id}|${section.path}`
                        return h(
                          'div',
                          { key: section.path, style: sideStyles.group },
                          h(SectionHead, {
                            label: section.primary
                              ? `${t('sidePrimaryShort')} · ${baseName(section.path)}`
                              : baseName(section.path),
                            count: section.entries.length,
                            expanded: collapsed[key] !== true,
                            title: section.path,
                            onToggle: () => toggle(key),
                            running: sectionRunning(section.entries),
                            runningLabel: t('sideRunning'),
                            glyph: section.primary ? null : h(FolderGlyph),
                            color: section.color,
                          }),
                          collapsed[key] !== true ? rowList(section.entries) : null,
                        )
                      }),
                      count === 0
                        ? h('div', { key: '__empty', style: sideStyles.emptyRow }, t('sideNoSessions'))
                        : null,
                    ],
              )
            }),
            tree.other.length === 0
              ? null
              : h(
                  'div',
                  { style: sideStyles.group },
                  h(GroupHead, {
                    label: t('sideOther'),
                    count: tree.other.length,
                    expanded: collapsed.__other !== true,
                    title: '',
                    onToggle: () => toggle('__other'),
                    color: null,
                    running: sectionRunning(tree.other),
                    runningLabel: t('sideRunning'),
                    extra: [],
                  }),
                  collapsed.__other !== true
                    ? [
                        ...tree.otherSections.map((section) => {
                          const key = `w:${section.workspaceId}`
                          const label =
                            section.title !== undefined && section.title !== null && section.title !== ''
                              ? section.title
                              : baseName(section.path)
                          return h(
                            'div',
                            { key: section.workspaceId, style: sideStyles.group },
                            h(SectionHead, {
                              label,
                              count: section.entries.length,
                              expanded: collapsed[key] !== true,
                              title: section.path,
                              onToggle: () => toggle(key),
                              running: sectionRunning(section.entries),
                              runningLabel: t('sideRunning'),
                              glyph: h(FolderGlyph),
                            }),
                            collapsed[key] !== true
                              ? h(SessionRows, { t, entries: section.entries, activeId: currentId, onOpen: openSessionRow, onMenu: openMenu })
                              : null,
                          )
                        }),
                        tree.otherLoose.length === 0
                          ? null
                          : h(
                              'div',
                              { key: '__loose', style: sideStyles.group },
                              tree.otherSections.length === 0
                                ? null
                                : h(SectionHead, {
                                    label: t('sideNoWorkspace'),
                                    count: tree.otherLoose.length,
                                    expanded: collapsed.__loose !== true,
                                    title: t('sideNoWorkspace'),
                                    onToggle: () => toggle('__loose'),
                                    running: sectionRunning(tree.otherLoose),
                                    runningLabel: t('sideRunning'),
                                    glyph: null,
                                  }),
                              collapsed.__loose !== true
                                ? h(SessionRows, { t, entries: tree.otherLoose, activeId: currentId, onOpen: openSessionRow, onMenu: openMenu })
                                : null,
                            ),
                      ]
                    : null,
                ),
            menu === null
              ? null
              : h(SessionMenu, {
                  t,
                  sessionId: menu.sessionId,
                  displayTitle: menu.displayTitle,
                  x: menu.x,
                  y: menu.y,
                  renderSlot,
                  actions,
                  projects,
                  assignments,
                  pinned: pinned.has(menu.sessionId),
                  archived: archived.has(menu.sessionId),
                  onOpen: openSessionRow,
                  onRename: (sessionId, title) => {
                    setMenu(null)
                    setRename({ sessionId, value: title ?? '', busy: false, error: '' })
                  },
                  onClose: () => setMenu(null),
                }),
            rename === null
              ? null
              : h(SessionRenameDialog, {
                  t,
                  sessionId: rename.sessionId,
                  value: rename.value,
                  busy: rename.busy,
                  error: rename.error,
                  onCancel: () => setRename(null),
                  onSubmit: (title) => {
                    setRename({ ...rename, busy: true, error: '' })
                    Promise.resolve()
                      .then(() => actions.rename(rename.sessionId, title))
                      .then(() => {
                        setRename(null)
                        void store.refresh()
                      })
                      .catch((failure) => setRename({ ...rename, busy: false, error: messageOf(failure) }))
                  },
                }),
            h(SessionToasts, {
              t,
              toasts,
              onOpen: openSessionRow,
              onDismiss: (key) => setToasts((list) => list.filter((item) => item.key !== key)),
            }),
          ),
        ),
      )
    }

    /**
     * Slot-level containment. The region's own boundary sits inside its return
     * value, which cannot catch a throw in `ProjectsBrowser` itself (a host
     * without `useSessions`, a malformed workspace snapshot): this wrapper is
     * the one registered in the slot, so a failure keeps the shipped sidebar
     * usable and shows the recovery hint instead.
     */
    function ProjectsBrowserBoundary(props) {
      const fallback = typeof props?.t === 'function' ? props.t('sideFailure') : 'The projects sidebar failed to render.'
      return h(SectionBoundary, { fallback }, h(ProjectsBrowser, props))
    }

    /** Header chip: which project folder this session runs in, and its primary. */
    function SessionProjectBadge(props) {
      const { t, sessionId, useSessions, store, manage } = props
      const row = useSessions((state) => state.byId[sessionId])
      const snapshot = useSnapshot(store)

      React.useEffect(() => {
        void store.refresh()
      }, [store])

      const hit = filingOf(snapshot.projects, snapshot.assignments, sessionId, row?.cwd)
      if (hit === null) return null
      const primaryBase = baseName(hit.project.primaryPath)
      const label = hit.primary
        ? `${hit.project.name} · ${t('sidePrimaryShort')} ${primaryBase}`
        : `${hit.project.name} · ${t('sideCurrent')} ${baseName(hit.folder)}`
      return h(
        'button',
        {
          type: 'button',
          style: sideStyles.badge,
          title: `${hit.project.name}\n${t('badgePrimary')}: ${hit.project.primaryPath}\n${t('badgeCurrent')}: ${hit.folder}`,
          onClick: manage,
        },
        '🗀 ',
        label,
      )
    }

    /** Client plugin body: dictionary, host calls, and the two slot entries. */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-projects: dictionaries')
      const t = ctx.locale.bind(NS)

      /** One call to the Host's fenced `/projects/api` JSON route. */
      const call = async (method, payload) => {
        const base = new URL('./', document.baseURI)
        const url = new URL(`projects/api/${method}`, base)
        const response = await fetch(url.href, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload ?? {}),
          credentials: 'same-origin',
        })
        let body = null
        try {
          body = await response.json()
        } catch {
          body = null
        }
        if (body !== null && body.ok === true) return body.value
        const detail =
          body !== null && typeof body.error?.message === 'string' && body.error.message !== ''
            ? body.error.message
            : `projects API "${method}" failed (HTTP ${response.status})`
        throw new Error(detail)
      }

      const pickFolder = () => ctx.uiWorkspace.pickDirectory()

      /** The one shared registry read behind the tree, the page, and the badge. */
      const store = createProjectsStore(() => call('list'))

      /** Register the project's primary workspace, then open a blank session in it. */
      const startProject = async (project) => {
        const workspace = await ctx.workspaces.create({ path: project.primaryPath })
        if (workspace === null || typeof workspace?.workspaceId !== 'string') {
          throw new Error('could not register the project primary workspace')
        }
        await ctx.uiWorkspace.startSession(workspace.workspaceId)
      }

      /** Switch the main panel to this plugin's project manager page. */
      const manage = () => ctx.layout.selectPanel(PANEL_ID)

      /** Open one existing session from a tree row. */
      const open = (sessionId) => ctx.uiWorkspace.openSession(sessionId)

      /**
       * The shipped Session actions, kept for the menu's fallback rows: the
       * browsing region's own rows normally perform these, but they must stay
       * reachable when that list cannot be rendered.
       */
      const reportActionFailure = (failure) => console.error('[dsh-projects] session action failed:', failure)
      const sessionActions = {
        pin: (sessionId) => ctx.uiWorkspace.pinSession(sessionId).catch(reportActionFailure),
        unpin: (sessionId) => ctx.uiWorkspace.unpinSession(sessionId).catch(reportActionFailure),
        archive: (sessionId) => ctx.uiWorkspace.archiveSession(sessionId).catch(reportActionFailure),
        unarchive: (sessionId) => ctx.uiWorkspace.unarchiveSession(sessionId).catch(reportActionFailure),
        fork: (sessionId) => ctx.uiWorkspace.forkSession(sessionId).catch(reportActionFailure),
        copyId: (sessionId) => {
          const clipboard = globalThis.navigator?.clipboard
          if (clipboard === undefined || typeof clipboard.writeText !== 'function') {
            reportActionFailure(new Error('the clipboard is unavailable'))
            return
          }
          clipboard.writeText(sessionId).catch(reportActionFailure)
        },
        /** Rename a Session through the shipped session service. */
        rename: async (sessionId, title) => {
          const sessions = typeof ctx.get === 'function' ? ctx.get('sessions') : ctx.sessions
          const value = String(title ?? '').trim()
          if (value === '') return
          if (sessions === null || sessions === undefined) {
            throw new Error('the session service is unavailable')
          }
          await sessions.using(sessionId, { source: 'workspaceOperation' }, (reference) =>
            reference.binding.session.rename(value),
          )
        },
        /**
         * File one session under a project folder, or drop the filing. Only the
         * sidebar grouping changes; the session keeps its own working directory
         * because DSH binds a session to the workspace whose path is its cwd.
         */
        assign: async (sessionId, target) => {
          /** The menu closes on pick, so the result needs its own feedback. */
          const folder = typeof target?.folder === 'string' ? target.folder : ''
          const projectId = typeof target?.projectId === 'string' ? target.projectId : ''
          try {
            await call('assignSession', { sessionId, projectId, folder })
            actionFeedback.emit(
              projectId === ''
                ? t('sideMoveRestored')
                : `${t('sideMovedTo')} ${baseName(folder)}`,
            )
          } catch (failure) {
            reportActionFailure(failure)
            actionFeedback.emit(`${t('sideMoveFailed')}: ${messageOf(failure)}`)
          }
          await store.refresh()
        },
      }

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 20,
            locale: NS,
            label: () => t('panel'),
          },
          ProjectsIcon,
        ),
      )

      ctx.slots.inject('main', () =>
        ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID,
            locale: NS,
            inject: () => ({ call, pickFolder, startProject, store }),
          },
          ProjectsPage,
        ),
      )

      // Shadow the shipped WorkspaceBrowser so the region renders
      // "project -> sessions" instead of "workspace -> sessions". A lower
      // priority value sits closer to the top layer and takes the single seat.
      // The Host row config can withdraw the takeover (`sidebarTakeover: false`),
      // which leaves the official browser untouched.
      const registerSidebar = () =>
        ctx.slots.inject('sidebar.workspaces', () =>
          ctx.slots.register(
            {
              name: 'sidebar.workspaces',
              priority: -100,
              locale: NS,
              inject: () => ({ store, start: startProject, manage, open, call, actions: sessionActions }),
            },
            ProjectsBrowserBoundary,
          ),
        )
      void call('list')
        .then((value) => {
          if (value?.settings?.sidebarTakeover !== false) registerSidebar()
        })
        .catch(() => registerSidebar())

      // Session header chip: current folder plus the project's primary workspace.
      ctx.slots.inject('conversation.session.header.actions', () =>
        ctx.slots.register(
          {
            name: 'conversation.session.header.actions',
            id: 'project-folders',
            order: 30,
            locale: NS,
            inject: () => ({ store, manage }),
          },
          SessionProjectBadge,
        ),
      )
    }

    return {
      inject: ['slots', 'locale', 'layout', 'workspaces', 'uiWorkspace'],
      apply,
    }
  },
})
