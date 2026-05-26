const API_BASE =
  window.location.protocol === 'file:'
    ? 'http://localhost:3000'
    : window.location.origin;

const storage = {
  token: 'core_token',
  user: 'core_user',
  project: 'core_project',
};

const state = {
  token: localStorage.getItem(storage.token),
  user: readStoredUser(),
  projects: [],
  columns: [],
  notifications: [],
  activeProjectId: localStorage.getItem(storage.project),
  selectedTask: null,
  chatTaskId: null,
  draggedTaskId: null,
  dragStartedAt: 0,
  searchQuery: '',
  socket: null,
};

let chatControlsBound = false;

const els = {
  authView: document.querySelector('#authView'),
  appView: document.querySelector('#appView'),
  loginForm: document.querySelector('#loginForm'),
  registerForm: document.querySelector('#registerForm'),
  authStatus: document.querySelector('#authStatus'),
  projectList: document.querySelector('#projectList'),
  projectCount: document.querySelector('#projectCount'),
  projectTitle: document.querySelector('#projectTitle'),
  projectDescription: document.querySelector('#projectDescription'),
  boardSubtitle: document.querySelector('#boardSubtitle'),
  board: document.querySelector('#board'),
  currentUser: document.querySelector('#currentUser'),
  searchInput: document.querySelector('#searchInput'),
  logoutBtn: document.querySelector('#logoutBtn'),
  newProjectBtn: document.querySelector('#newProjectBtn'),
  projectModal: document.querySelector('#projectModal'),
  projectForm: document.querySelector('#projectForm'),
  taskModal: document.querySelector('#taskModal'),
  taskForm: document.querySelector('#taskForm'),
  taskColumnId: document.querySelector('#taskColumnId'),
  taskAssignees: document.querySelector('#taskAssignees'),
  columnForm: document.querySelector('#columnForm'),
  inviteForm: document.querySelector('#inviteForm'),
  chatBtn: document.querySelector('#chatBtn'),
  chatPanel: document.querySelector('#chatPanel'),
  closeChatBtn: document.querySelector('#closeChatBtn'),
  chatTaskList: document.querySelector('#chatTaskList'),
  chatThreadHeader: document.querySelector('#chatThreadHeader'),
  chatMessages: document.querySelector('#chatMessages'),
  chatForm: document.querySelector('#chatForm'),
  notificationsBtn: document.querySelector('#notificationsBtn'),
  notificationBadge: document.querySelector('#notificationBadge'),
  notificationPanel: document.querySelector('#notificationPanel'),
  closeNotificationsBtn: document.querySelector('#closeNotificationsBtn'),
  notificationList: document.querySelector('#notificationList'),
  markReadBtn: document.querySelector('#markReadBtn'),
  clearNotificationsBtn: document.querySelector('#clearNotificationsBtn'),
  taskDrawer: document.querySelector('#taskDrawer'),
  closeDrawerBtn: document.querySelector('#closeDrawerBtn'),
  drawerTitle: document.querySelector('#drawerTitle'),
  drawerColumn: document.querySelector('#drawerColumn'),
  taskEditForm: document.querySelector('#taskEditForm'),
  editTitle: document.querySelector('#editTitle'),
  editDescription: document.querySelector('#editDescription'),
  editPriority: document.querySelector('#editPriority'),
  editDueDate: document.querySelector('#editDueDate'),
  editColumn: document.querySelector('#editColumn'),
  editAssignees: document.querySelector('#editAssignees'),
  deleteTaskBtn: document.querySelector('#deleteTaskBtn'),
  commentForm: document.querySelector('#commentForm'),
  commentList: document.querySelector('#commentList'),
  commentCount: document.querySelector('#commentCount'),
  activityList: document.querySelector('#activityList'),
  activityCount: document.querySelector('#activityCount'),
  connectionStatus: document.querySelector('#connectionStatus'),
  toastHost: document.querySelector('#toastHost'),
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  bindMotion();
  bindAuth();
  bindWorkspace();
  initRotatingWords();
  updateScrollProgress();

  if (state.token && state.user) {
    bootWorkspace();
  } else {
    showAuth();
  }
}

function bindMotion() {
  document.addEventListener('pointerdown', animatePress);
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);
}

function animatePress(event) {
  const target = event.target.closest(
    'button, a.primary-btn, a.ghost-btn, .nav-cta, .project-button, .task-card, .chat-task, .notification-item, .step-grid article, .tech-grid article',
  );

  if (!target || target.disabled || !document.body.contains(target)) return;

  target.classList.add('is-pressing');
  window.setTimeout(() => target.classList.remove('is-pressing'), 180);
}

function updateScrollProgress() {
  const progress = document.querySelector('#scrollProgress');
  if (!progress) return;

  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  progress.style.transform = `scaleX(${ratio})`;
}

function initRotatingWords() {
  const el = document.getElementById('rotating-word');
  if (!el) return;

  const words = ['input.', 'engine.', 'output.'];
  let i = 0;
  el.textContent = words[i];

  setInterval(() => {
    // animate out
    el.classList.add('rotating-out');
    setTimeout(() => {
      i = (i + 1) % words.length;
      el.textContent = words[i];
      el.classList.remove('rotating-out');
      el.classList.add('rotating-in');
      setTimeout(() => el.classList.remove('rotating-in'), 300);
    }, 220);
  }, 1500);
}

// Liquid ink-like particle effect drawn to a full-screen canvas.
function initLiquidEffect() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('liquidCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = (canvas.width = window.innerWidth);
  let H = (canvas.height = window.innerHeight);
  const particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);

  function addParticle(x, y, force = 1) {
    const r = 24 + Math.random() * 80 * force;
    particles.push({ x, y, vx: (Math.random() - 0.5) * 4 * force, vy: (Math.random() - 0.5) * 4 * force, r, life: 1 });
  }

  let lastMove = 0;
  window.addEventListener('pointermove', (e) => {
    const now = Date.now();
    const force = Math.min(1.6, Math.max(0.6, (now - lastMove) / 16));
    lastMove = now;
    addParticle(e.clientX, e.clientY, force);
    // spawn a couple more for density
    addParticle(e.clientX + Math.random() * 24 - 12, e.clientY + Math.random() * 24 - 12, force * 0.6);
  }, { passive: true });

  // touch fallback
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (t) addParticle(t.clientX, t.clientY, 1.0);
  }, { passive: true });

  function step() {
    // fade to white slightly to create trailing
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'blur(10px)';

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.986;
      p.vy *= 0.986;
      p.r *= 0.997;
      p.life -= 0.006;

      if (p.life <= 0 || p.r < 2) particles.splice(i, 1);
    }

    ctx.filter = 'none';
    requestAnimationFrame(step);
  }

  // initial clear to white
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, W, H);
  step();
}

function initInkToggle() {
  const timeouts = new WeakMap();

  function markAtPoint(x, y) {
    const elems = document.elementsFromPoint(x, y);
    for (const el of elems) {
      const target = el.closest('h1,h2,h3,h4,.hero-line,p,li,span,button,a,.task-card,.section-index');
      if (target) {
        if (!target.classList.contains('inked')) target.classList.add('inked');
        if (timeouts.has(target)) clearTimeout(timeouts.get(target));
        timeouts.set(target, setTimeout(() => {
          target.classList.remove('inked');
          timeouts.delete(target);
        }, 900));
        break;
      }
    }
  }

  window.addEventListener('pointermove', (e) => {
    markAtPoint(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    const t = e.touches && e.touches[0];
    if (t) markAtPoint(t.clientX, t.clientY);
  }, { passive: true });
}



function bindAuth() {
  document.querySelectorAll('[data-auth-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.authTab;
      document.querySelectorAll('[data-auth-tab]').forEach((tab) => {
        tab.classList.toggle('is-active', tab.dataset.authTab === mode);
      });
      els.loginForm.hidden = mode !== 'login';
      els.registerForm.hidden = mode !== 'register';
      setStatus('');
    });
  });

  els.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitAuth('login', new FormData(els.loginForm));
  });

  els.registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitAuth('register', new FormData(els.registerForm));
  });
}

function bindWorkspace() {
  els.logoutBtn.addEventListener('click', signOut);
  els.newProjectBtn.addEventListener('click', () => openModal(els.projectModal));
  els.projectForm.addEventListener('submit', createProject);
  els.taskForm.addEventListener('submit', createTask);
  els.columnForm.addEventListener('submit', createColumn);
  els.inviteForm.addEventListener('submit', inviteMember);
  els.chatBtn.addEventListener('click', openChatPanel);
  els.closeChatBtn.addEventListener('click', () => {
    els.chatPanel.hidden = true;
  });
  bindChatControls();
  els.notificationsBtn.addEventListener('click', () => {
    els.notificationPanel.hidden = !els.notificationPanel.hidden;
  });
  els.closeNotificationsBtn.addEventListener('click', () => {
    els.notificationPanel.hidden = true;
  });
  els.markReadBtn.addEventListener('click', markNotificationsRead);
  els.clearNotificationsBtn.addEventListener('click', clearNotifications);
  els.closeDrawerBtn.addEventListener('click', closeTaskDrawer);
  els.taskEditForm.addEventListener('submit', updateTask);
  els.deleteTaskBtn.addEventListener('click', deleteTask);
  els.commentForm.addEventListener('submit', addComment);

  els.searchInput.addEventListener('input', () => {
    state.searchQuery = els.searchInput.value.trim().toLowerCase();
    renderBoard();
  });

  document.querySelectorAll('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelector(`#${button.dataset.closeModal}`).hidden = true;
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        backdrop.hidden = true;
      }
    });
  });
}

function bindChatControls() {
  if (chatControlsBound || !els.chatForm) return;

  els.chatForm.onsubmit = handleChatSend;
  els.chatForm.addEventListener('submit', handleChatSend);
  const submitButton = els.chatForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.onclick = handleChatSend;
    submitButton.addEventListener('click', handleChatSend);
  }
  document.addEventListener('submit', handleDelegatedChatSend);
  document.addEventListener('click', handleDelegatedChatSend);
  chatControlsBound = true;
}

function handleDelegatedChatSend(event) {
  const isChatSubmit =
    event.type === 'submit' && event.target === els.chatForm;
  const isChatButton =
    event.type === 'click' && event.target.closest('#chatForm button[type="submit"]');

  if (isChatSubmit || isChatButton) {
    handleChatSend(event);
  }
}

function handleChatSend(event) {
  if (event.coreChatHandled) return;
  event.coreChatHandled = true;
  sendChatMessage(event);
}

async function submitAuth(mode, formData) {
  setStatus(mode === 'login' ? 'Signing in...' : 'Creating account...');

  try {
    const payload = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    if (mode === 'register') {
      payload.displayName = formData.get('displayName');
    }

    const auth = await api(`/api/auth/${mode}`, {
      method: 'POST',
      body: payload,
      skipAuth: true,
    });

    state.token = auth.token;
    state.user = auth.user;
    localStorage.setItem(storage.token, auth.token);
    localStorage.setItem(storage.user, JSON.stringify(auth.user));
    setStatus('');
    await bootWorkspace();
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function bootWorkspace() {
  showWorkspace();
  await connectSocket();
  renderCurrentUser();

  try {
    await Promise.all([loadProjects(), loadNotifications()]);
  } catch (error) {
    notify(error.message);
    if (/token|expired|missing|invalid/i.test(error.message)) {
      signOut();
    }
  }
}

function showAuth() {
  els.authView.hidden = false;
  els.appView.hidden = true;
}

function showWorkspace() {
  els.authView.hidden = true;
  els.appView.hidden = false;
}

function setStatus(message, isError = false) {
  els.authStatus.textContent = message;
  els.authStatus.classList.toggle('is-error', isError);
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (!options.skipAuth && state.token) {
    headers.set('Authorization', `Bearer ${state.token}`);
  }

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${path}`, fetchOptions);
  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new Error(data && data.error ? data.error : `Request failed with ${response.status}`);
  }

  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

async function loadProjects() {
  state.projects = await api('/api/projects');

  if (!state.projects.some((project) => project.id === state.activeProjectId)) {
    state.activeProjectId = state.projects[0] ? state.projects[0].id : null;
  }

  if (state.activeProjectId) {
    localStorage.setItem(storage.project, state.activeProjectId);
  } else {
    localStorage.removeItem(storage.project);
  }

  renderProjects();

  if (state.activeProjectId) {
    await loadBoard();
    joinActiveProject();
  } else {
    renderEmptyWorkspace();
  }
}

async function loadBoard() {
  if (!state.activeProjectId) return;
  state.columns = await api(`/api/projects/${state.activeProjectId}/tasks`);
  renderBoard();
  renderProjects();
  if (!els.chatPanel.hidden) {
    renderChatTasks();
  }
}

async function loadNotifications() {
  state.notifications = await api('/api/notifications');
  renderNotifications();
}

function renderProjects() {
  els.projectCount.textContent = state.projects.length;
  els.projectList.innerHTML = '';

  if (state.projects.length === 0) {
    els.projectList.innerHTML = '<div class="empty-state">No projects yet.</div>';
    return;
  }

  state.projects.forEach((project) => {
    const members = getProjectMembers(project);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `project-button${project.id === state.activeProjectId ? ' is-active' : ''}`;
    button.innerHTML = `
      <div>
        <strong>${escapeHtml(project.name)}</strong>
        <span class="count">${members.length} member${members.length === 1 ? '' : 's'}</span>
      </div>
      <span class="meta">${formatShortDate(project.createdAt)}</span>
    `;
    button.addEventListener('click', () => selectProject(project.id));
    els.projectList.appendChild(button);
  });
}

async function selectProject(projectId) {
  if (state.activeProjectId === projectId) return;
  state.activeProjectId = projectId;
  state.chatTaskId = null;
  localStorage.setItem(storage.project, projectId);
  renderProjects();
  await loadBoard();
  joinActiveProject();
}

function renderEmptyWorkspace() {
  els.projectTitle.textContent = 'No project selected';
  els.projectDescription.textContent = 'Create a project to open the board.';
  els.boardSubtitle.textContent = 'The board will appear after a project exists.';
  els.board.innerHTML = '<div class="empty-state">Create your first project to start.</div>';
}

function renderBoard() {
  const project = activeProject();

  if (!project) {
    renderEmptyWorkspace();
    return;
  }

  const tasks = state.columns.flatMap((column) => column.tasks || []);
  const visibleColumns = state.columns.map((column) => ({
    ...column,
    tasks: (column.tasks || []).filter(taskMatchesQuery),
  }));
  const visibleTaskCount = visibleColumns.flatMap((column) => column.tasks || []).length;

  els.projectTitle.textContent = project.name;
  els.projectDescription.textContent = project.description || 'No description set.';
  els.boardSubtitle.textContent = state.searchQuery
    ? `${visibleTaskCount} matching cards across ${state.columns.length} columns`
    : `${state.columns.length} columns, ${tasks.length} cards`;
  els.inviteForm.querySelector('input').disabled = !project;
  els.inviteForm.querySelector('button').disabled = !project;

  if (state.columns.length === 0) {
    els.board.innerHTML = '<div class="empty-state">Add a column to begin.</div>';
    return;
  }

  els.board.innerHTML = visibleColumns.map(columnTemplate).join('');
  bindBoardEvents();
}

function openChatPanel() {
  bindChatControls();
  els.chatPanel.hidden = false;
  renderChatTasks();

  const tasks = assignedTasks();
  if (tasks.length > 0) {
    loadChatTask(state.chatTaskId && tasks.some((task) => task.id === state.chatTaskId) ? state.chatTaskId : tasks[0].id);
  } else {
    state.chatTaskId = null;
    els.chatThreadHeader.innerHTML = `
      <strong>No task chat selected</strong>
      <span>Assign a task to yourself to open messages.</span>
    `;
    els.chatMessages.innerHTML = emptyChatThreadTemplate();
    els.chatForm.hidden = true;
  }
}

function renderChatTasks() {
  const tasks = assignedTasks();

  if (tasks.length === 0) {
    els.chatTaskList.innerHTML = emptyChatListTemplate();
    return;
  }

  els.chatTaskList.innerHTML = tasks
    .map((task) => `
      <button class="chat-task${task.id === state.chatTaskId ? ' is-active' : ''}" type="button" data-chat-task="${escapeAttr(task.id)}">
        <strong>${escapeHtml(task.title)}</strong>
        <span>${escapeHtml(getColumnName(task.columnId))}</span>
      </button>
    `)
    .join('');

  document.querySelectorAll('[data-chat-task]').forEach((button) => {
    button.addEventListener('click', () => loadChatTask(button.dataset.chatTask));
  });
}

async function loadChatTask(taskId) {
  try {
    const task = await api(`/api/tasks/${taskId}/details`);
    state.chatTaskId = task.id;
    renderChatTasks();
    renderChatThread(task);
  } catch (error) {
    notify(error.message);
  }
}

function renderChatThread(task) {
  const assignees = getAssignees(task.assignees);
  els.chatThreadHeader.innerHTML = `
    <strong>${escapeHtml(task.title)}</strong>
    <span>${assignees.length ? assignees.map((user) => escapeHtml(user.displayName || user.email)).join(', ') : 'No assignees'}</span>
  `;

  const comments = [...(task.comments || [])].reverse();
  els.chatMessages.innerHTML = comments.length
    ? comments.map(chatMessageTemplate).join('')
    : emptyMessagesTemplate();
  els.chatForm.hidden = false;
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

function emptyChatListTemplate() {
  return `
    <div class="chat-empty chat-empty-list">
      <span class="material-symbols-outlined" aria-hidden="true">inbox</span>
      <strong>No assigned tasks</strong>
      <small>Task chats will appear here.</small>
    </div>
  `;
}

function emptyChatThreadTemplate() {
  return `
    <div class="chat-empty chat-empty-thread">
      <span class="material-symbols-outlined" aria-hidden="true">forum</span>
      <strong>No task chat yet</strong>
      <small>Create a task, assign it to yourself, then open chat.</small>
    </div>
  `;
}

function emptyMessagesTemplate() {
  return `
    <div class="chat-empty chat-empty-thread">
      <span class="material-symbols-outlined" aria-hidden="true">chat_bubble</span>
      <strong>No messages yet</strong>
      <small>Start the task conversation.</small>
    </div>
  `;
}

function chatMessageTemplate(comment) {
  const author = comment.author || {};
  const isMine = state.user && author.id === state.user.id;
  return `
    <article class="chat-message${isMine ? ' is-mine' : ''}">
      <small>${escapeHtml(author.displayName || 'Unknown')} / ${formatShortDate(comment.createdAt)}</small>
      <p>${escapeHtml(comment.content)}</p>
    </article>
  `;
}

async function sendChatMessage(event) {
  event.preventDefault();

  if (!state.chatTaskId) {
    notify('Choose an assigned task first.');
    return;
  }

  const content = new FormData(els.chatForm).get('content');

  try {
    await api(`/api/tasks/${state.chatTaskId}/comments`, {
      method: 'POST',
      body: { content },
    });
    els.chatForm.reset();
    await loadChatTask(state.chatTaskId);
  } catch (error) {
    notify(error.message);
  }
}

function columnTemplate(column) {
  const tasks = column.tasks || [];
  return `
    <section class="column" data-column-id="${escapeAttr(column.id)}">
      <header class="column-header">
        <div class="column-title">
          <h4>${escapeHtml(column.name)}</h4>
          <span class="count">${tasks.length} task${tasks.length === 1 ? '' : 's'}</span>
        </div>
        <div class="column-controls">
          <button class="mini-btn" type="button" data-rename-column="${escapeAttr(column.id)}">Rename</button>
          <button class="mini-btn danger" type="button" data-delete-column="${escapeAttr(column.id)}">Delete</button>
        </div>
      </header>
      <div class="task-list" data-task-list data-column-id="${escapeAttr(column.id)}">
        ${tasks.map((task) => taskTemplate(task)).join('')}
      </div>
      <button class="add-task-btn" type="button" data-new-task="${escapeAttr(column.id)}">Add task</button>
    </section>
  `;
}

function taskTemplate(task) {
  const assignees = getAssignees(task.assignees);
  return `
    <article class="task-card" draggable="true" data-task-id="${escapeAttr(task.id)}">
      <div class="task-top">
        <span class="priority ${escapeAttr(task.priority)}">${escapeHtml(priorityLabel(task.priority))}</span>
        <time>${formatShortDate(task.dueDate)}</time>
      </div>
      <h5>${escapeHtml(task.title)}</h5>
      ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
      <div class="task-divider" aria-hidden="true"></div>
      <div class="task-foot">
        <div class="assignee-stack">
          ${assignees.map((user) => `<span class="avatar" title="${escapeAttr(user.displayName)}">${escapeHtml(initials(user.displayName || user.email))}</span>`).join('')}
        </div>
        <span>${assignees.length || 'No'} assigned</span>
      </div>
    </article>
  `;
}

function bindBoardEvents() {
  document.querySelectorAll('[data-new-task]').forEach((button) => {
    button.addEventListener('click', () => openTaskModal(button.dataset.newTask));
  });

  document.querySelectorAll('[data-rename-column]').forEach((button) => {
    button.addEventListener('click', () => renameColumn(button.dataset.renameColumn));
  });

  document.querySelectorAll('[data-delete-column]').forEach((button) => {
    button.addEventListener('click', () => deleteColumn(button.dataset.deleteColumn));
  });

  document.querySelectorAll('.task-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (Date.now() - state.dragStartedAt > 250) {
        openTask(card.dataset.taskId);
      }
    });
    card.addEventListener('dragstart', (event) => {
      state.draggedTaskId = card.dataset.taskId;
      state.dragStartedAt = Date.now();
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', card.dataset.taskId);
      setTimeout(() => card.classList.add('is-dragging'), 0);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
      state.draggedTaskId = null;
      document.querySelectorAll('.task-list.is-over').forEach((list) => list.classList.remove('is-over'));
    });
  });

  document.querySelectorAll('[data-task-list]').forEach((list) => {
    list.addEventListener('dragover', (event) => {
      event.preventDefault();
      list.classList.add('is-over');
    });
    list.addEventListener('dragleave', () => {
      list.classList.remove('is-over');
    });
    list.addEventListener('drop', async (event) => {
      event.preventDefault();
      list.classList.remove('is-over');
      await moveDraggedTask(list, event.clientY);
    });
  });
}

async function moveDraggedTask(list, pointerY) {
  const taskId = state.draggedTaskId;
  if (!taskId) return;

  const columnId = list.dataset.columnId;
  const cards = [...list.querySelectorAll('.task-card:not(.is-dragging)')];
  let order = cards.findIndex((card) => {
    const rect = card.getBoundingClientRect();
    return pointerY < rect.top + rect.height / 2;
  });

  if (order === -1) {
    order = cards.length;
  }

  try {
    await api(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: { columnId, order },
    });
    await loadBoard();
  } catch (error) {
    notify(error.message);
  }
}

async function createProject(event) {
  event.preventDefault();
  const formData = new FormData(els.projectForm);

  try {
    const project = await api('/api/projects', {
      method: 'POST',
      body: {
        name: formData.get('name'),
        description: formData.get('description'),
      },
    });
    els.projectModal.hidden = true;
    els.projectForm.reset();
    state.activeProjectId = project.id;
    await loadProjects();
    notify('Project created.');
  } catch (error) {
    notify(error.message);
  }
}

async function createColumn(event) {
  event.preventDefault();
  const project = activeProject();
  if (!project) return;

  const input = els.columnForm.elements.name;
  const name = input.value.trim();
  if (!name) return;

  try {
    await api(`/api/projects/${project.id}/columns`, {
      method: 'POST',
      body: { name },
    });
    input.value = '';
    await loadBoard();
  } catch (error) {
    notify(error.message);
  }
}

async function renameColumn(columnId) {
  const column = state.columns.find((item) => item.id === columnId);
  if (!column) return;

  const name = window.prompt('Column name', column.name);
  if (!name || !name.trim()) return;

  try {
    await api(`/api/columns/${columnId}`, {
      method: 'PATCH',
      body: { name: name.trim() },
    });
    await loadBoard();
  } catch (error) {
    notify(error.message);
  }
}

async function deleteColumn(columnId) {
  const column = state.columns.find((item) => item.id === columnId);
  if (!column) return;

  const ok = window.confirm(`Delete "${column.name}" and its tasks?`);
  if (!ok) return;

  try {
    await api(`/api/columns/${columnId}`, { method: 'DELETE' });
    await loadBoard();
  } catch (error) {
    notify(error.message);
  }
}

async function inviteMember(event) {
  event.preventDefault();
  const project = activeProject();
  if (!project) return;

  const emailInput = els.inviteForm.elements.email;
  const email = emailInput.value.trim();
  if (!email) return;

  try {
    await api(`/api/projects/${project.id}/invite`, {
      method: 'POST',
      body: { email },
    });
    emailInput.value = '';
    await loadProjects();
    notify('Member invited.');
  } catch (error) {
    notify(error.message);
  }
}

function openTaskModal(columnId) {
  els.taskForm.reset();
  els.taskColumnId.value = columnId;
  renderAssigneeChecks(els.taskAssignees, []);
  openModal(els.taskModal);
}

async function createTask(event) {
  event.preventDefault();
  const formData = new FormData(els.taskForm);

  try {
    await api('/api/tasks', {
      method: 'POST',
      body: {
        columnId: formData.get('columnId'),
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        dueDate: formData.get('dueDate') || null,
        assignees: selectedAssignees(els.taskAssignees).join(','),
      },
    });
    els.taskModal.hidden = true;
    els.taskForm.reset();
    await loadBoard();
  } catch (error) {
    notify(error.message);
  }
}

async function openTask(taskId) {
  try {
    const task = await api(`/api/tasks/${taskId}/details`);
    state.selectedTask = task;
    renderTaskDrawer(task);
    els.taskDrawer.hidden = false;
  } catch (error) {
    notify(error.message);
  }
}

function renderTaskDrawer(task) {
  const column = getColumnForTask(task.id);
  const assigneeIds = parseIds(task.assignees);

  els.drawerTitle.textContent = task.title;
  els.drawerColumn.textContent = column ? column.name : 'Task';
  els.editTitle.value = task.title || '';
  els.editDescription.value = task.description || '';
  els.editPriority.value = task.priority || 'MEDIUM';
  els.editDueDate.value = task.dueDate ? toInputDate(task.dueDate) : '';

  els.editColumn.innerHTML = state.columns
    .map((item) => `<option value="${escapeAttr(item.id)}"${item.id === task.columnId ? ' selected' : ''}>${escapeHtml(item.name)}</option>`)
    .join('');

  renderAssigneeChecks(els.editAssignees, assigneeIds);
  renderComments(task.comments || []);
  renderActivity(task.activityLogs || []);
}

async function updateTask(event) {
  event.preventDefault();
  if (!state.selectedTask) return;

  try {
    await api(`/api/tasks/${state.selectedTask.id}`, {
      method: 'PATCH',
      body: {
        title: els.editTitle.value,
        description: els.editDescription.value,
        priority: els.editPriority.value,
        dueDate: els.editDueDate.value || null,
        columnId: els.editColumn.value,
        assignees: selectedAssignees(els.editAssignees).join(','),
      },
    });
    await loadBoard();
    await openTask(state.selectedTask.id);
    notify('Task updated.');
  } catch (error) {
    notify(error.message);
  }
}

async function deleteTask() {
  if (!state.selectedTask) return;

  const ok = window.confirm(`Delete "${state.selectedTask.title}"?`);
  if (!ok) return;

  try {
    await api(`/api/tasks/${state.selectedTask.id}`, { method: 'DELETE' });
    closeTaskDrawer();
    await loadBoard();
  } catch (error) {
    notify(error.message);
  }
}

async function addComment(event) {
  event.preventDefault();
  if (!state.selectedTask) return;

  const content = new FormData(els.commentForm).get('content');

  try {
    await api(`/api/tasks/${state.selectedTask.id}/comments`, {
      method: 'POST',
      body: { content },
    });
    els.commentForm.reset();
    await openTask(state.selectedTask.id);
  } catch (error) {
    notify(error.message);
  }
}

function renderComments(comments) {
  els.commentCount.textContent = comments.length;

  if (comments.length === 0) {
    els.commentList.innerHTML = '<div class="notification-item">No comments yet.</div>';
    return;
  }

  els.commentList.innerHTML = comments
    .map((comment) => {
      const author = comment.author || {};
      return `
        <article class="comment-item">
          <div class="comment-meta">
            <strong>${escapeHtml(author.displayName || 'Unknown')}</strong>
            <small>${formatShortDate(comment.createdAt)}</small>
          </div>
          <p>${escapeHtml(comment.content)}</p>
        </article>
      `;
    })
    .join('');
}

function renderActivity(activityLogs) {
  els.activityCount.textContent = activityLogs.length;

  if (activityLogs.length === 0) {
    els.activityList.innerHTML = '<div class="activity-item"><p>No activity yet.</p></div>';
    return;
  }

  els.activityList.innerHTML = activityLogs
    .map((item) => `
      <article class="activity-item">
        <p>${escapeHtml(item.user ? item.user.displayName : 'Someone')} ${escapeHtml(item.content)}</p>
        <small>${formatShortDate(item.createdAt)}</small>
      </article>
    `)
    .join('');
}

function closeTaskDrawer() {
  els.taskDrawer.hidden = true;
  state.selectedTask = null;
}

async function markNotificationsRead() {
  try {
    await api('/api/notifications/read', { method: 'PATCH' });
    await loadNotifications();
  } catch (error) {
    notify(error.message);
  }
}

async function clearNotifications() {
  try {
    await api('/api/notifications', { method: 'DELETE' });
    state.notifications = [];
    renderNotifications();
  } catch (error) {
    notify(error.message);
  }
}

function renderNotifications() {
  const unread = state.notifications.filter((item) => !item.read).length;
  els.notificationBadge.textContent = unread;

  if (state.notifications.length === 0) {
    els.notificationList.innerHTML = '<div class="notification-item">No alerts.</div>';
    return;
  }

  els.notificationList.innerHTML = '';
  state.notifications.forEach((notification) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `notification-item${notification.read ? '' : ' unread'}`;
    button.innerHTML = `
      <small>${escapeHtml(notification.type)} / ${formatShortDate(notification.createdAt)}</small>
      <p>${escapeHtml(notification.content)}</p>
    `;
    button.addEventListener('click', async () => {
      if (notification.projectId && notification.projectId !== state.activeProjectId) {
        await selectProject(notification.projectId);
      }
      if (notification.taskId) {
        await openTask(notification.taskId);
      }
    });
    els.notificationList.appendChild(button);
  });
}

function loadSocketIo() {
  return new Promise((resolve) => {
    if (typeof io === 'function') return resolve();
    const script = document.createElement('script');
    const socketBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : API_BASE;
    script.src = `${socketBase}/socket.io/socket.io.js`;
    script.onload = () => resolve();
    script.onerror = () => {
      console.warn('Socket.IO script not available at', script.src);
      resolve();
    };
    document.head.appendChild(script);
  });
}

async function connectSocket() {
  if (state.socket) {
    state.socket.disconnect();
  }

  await loadSocketIo();
  if (typeof io !== 'function') {
    setConnection(false);
    return;
  }

  state.socket = io(API_BASE, {
    auth: { token: state.token },
    transports: ['websocket', 'polling'],
  });

  state.socket.on('connect', () => {
    setConnection(true);
    joinActiveProject();
  });

  state.socket.on('disconnect', () => setConnection(false));

  state.socket.on('board:refresh', async (payload) => {
    if (!payload || payload.projectId === state.activeProjectId) {
      await loadBoard();
    }
  });

  state.socket.on('comment:added', async (payload) => {
    if (state.selectedTask && payload && payload.taskId === state.selectedTask.id) {
      await openTask(state.selectedTask.id);
    }
    if (state.chatTaskId && payload && payload.taskId === state.chatTaskId) {
      await loadChatTask(state.chatTaskId);
    }
  });

  state.socket.on('notification:new', (notification) => {
    state.notifications = [notification, ...state.notifications].slice(0, 50);
    renderNotifications();
    notify(notification.content);
  });

  state.socket.on('project:members-updated', async (payload) => {
    if (!payload || payload.projectId === state.activeProjectId) {
      await loadProjects();
    }
  });

  state.socket.on('socket:error', (payload) => {
    notify(payload && payload.message ? payload.message : 'Live connection error.');
  });
}

function joinActiveProject() {
  if (state.socket && state.socket.connected && state.activeProjectId) {
    state.socket.emit('join', state.activeProjectId);
  }
}

function setConnection(isConnected) {
  els.connectionStatus.textContent = isConnected ? 'Live' : 'Offline';
  els.connectionStatus.classList.toggle('is-online', isConnected);
}

function renderCurrentUser() {
  const user = state.user || {};
  els.currentUser.innerHTML = `
    <span class="avatar">${escapeHtml(initials(user.displayName || user.email || 'U'))}</span>
    <div>
      <p>${escapeHtml(user.displayName || 'User')}</p>
      <small>${escapeHtml(user.email || '')}</small>
    </div>
  `;
}

function renderAssigneeChecks(container, selectedIds) {
  const members = getProjectMembers(activeProject());
  const selected = new Set(selectedIds);

  if (members.length === 0) {
    container.innerHTML = '<div class="notification-item">No members.</div>';
    return;
  }

  container.innerHTML = members
    .map((user) => `
      <label>
        <input type="checkbox" value="${escapeAttr(user.id)}"${selected.has(user.id) ? ' checked' : ''}>
        <span>${escapeHtml(user.displayName || user.email)}</span>
      </label>
    `)
    .join('');
}

function selectedAssignees(container) {
  return [...container.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
}

function activeProject() {
  return state.projects.find((project) => project.id === state.activeProjectId) || null;
}

function assignedTasks() {
  if (!state.user) return [];
  return state.columns
    .flatMap((column) => (column.tasks || []).map((task) => ({ ...task, columnId: task.columnId || column.id })))
    .filter((task) => parseIds(task.assignees).includes(state.user.id));
}

function taskMatchesQuery(task) {
  if (!state.searchQuery) return true;
  const assignees = getAssignees(task.assignees)
    .map((user) => `${user.displayName || ''} ${user.email || ''}`)
    .join(' ');
  return `${task.title || ''} ${task.description || ''} ${task.priority || ''} ${assignees}`
    .toLowerCase()
    .includes(state.searchQuery);
}

function priorityLabel(priority) {
  const normalized = String(priority || 'MEDIUM').toUpperCase();
  if (normalized === 'HIGH') return '!!! HIGH';
  if (normalized === 'LOW') return '! LOW';
  return '!! MEDIUM';
}

function getProjectMembers(project) {
  if (!project || !Array.isArray(project.members)) return [];
  return project.members.map((member) => member.user).filter(Boolean);
}

function getAssignees(value) {
  const ids = new Set(parseIds(value));
  return getProjectMembers(activeProject()).filter((member) => ids.has(member.id));
}

function parseIds(value) {
  return String(value || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function getColumnForTask(taskId) {
  return state.columns.find((column) => (column.tasks || []).some((task) => task.id === taskId)) || null;
}

function getColumnName(columnId) {
  const column = state.columns.find((item) => item.id === columnId);
  return column ? column.name : 'Task';
}

function formatShortDate(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function toInputDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function initials(value) {
  return String(value || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return map[char];
  });
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function notify(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  els.toastHost.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

function openModal(modal) {
  modal.hidden = false;
  const firstInput = modal.querySelector('input, textarea, select, button');
  if (firstInput) {
    firstInput.focus();
  }
}

function readStoredUser() {
  const raw = localStorage.getItem(storage.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function signOut() {
  if (state.socket) {
    state.socket.disconnect();
  }

  state.token = null;
  state.user = null;
  state.projects = [];
  state.columns = [];
  state.notifications = [];
  state.activeProjectId = null;
  state.selectedTask = null;
  localStorage.removeItem(storage.token);
  localStorage.removeItem(storage.user);
  localStorage.removeItem(storage.project);
  showAuth();
}
