// ================== CONFIG (FIXED) ==================

// ✅ Correct backend URL
const BACKEND_URL = 'https://core-backend-u2me.onrender.com';

// ✅ Smart environment switch (local vs production)
const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3100'
    : BACKEND_URL;

// ================== STORAGE ==================

const storage = {
  token: 'core_token',
  user: 'core_user',
  project: 'core_project',
};

// ================== STATE ==================

const state = {
  token: localStorage.getItem(storage.token),
  user: readStoredUser(),
  projects: [],
  columns: [],
  notifications: [],
  activeProjectId: localStorage.getItem(storage.project),
  selectedTask: null,
  chatTaskId: null,
  socket: null,
};

// ================== INIT ==================

document.addEventListener('DOMContentLoaded', init);

function init() {
  if (state.token && state.user) {
    bootWorkspace();
  } else {
    showAuth();
  }
}

// ================== AUTH ==================

async function submitAuth(mode, formData) {
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

    await bootWorkspace();
  } catch (error) {
    alert(error.message);
  }
}

// ================== API CORE ==================

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
    throw new Error(
      data && data.error ? data.error : `Request failed with ${response.status}`
    );
  }

  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ================== WORKSPACE ==================

async function bootWorkspace() {
  showWorkspace();

  try {
    await loadProjects();
  } catch (error) {
    alert(error.message);
    signOut();
  }
}

// ================== PROJECTS ==================

async function loadProjects() {
  state.projects = await api('/api/projects');
  console.log("Projects:", state.projects);
}

// ================== UI ==================

function showAuth() {
  document.getElementById('authView').hidden = false;
  document.getElementById('appView').hidden = true;
}

function showWorkspace() {
  document.getElementById('authView').hidden = true;
  document.getElementById('appView').hidden = false;
}

// ================== SESSION ==================

function signOut() {
  localStorage.removeItem(storage.token);
  localStorage.removeItem(storage.user);
  localStorage.removeItem(storage.project);
  location.reload();
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(storage.user));
  } catch {
    return null;
  }
}
