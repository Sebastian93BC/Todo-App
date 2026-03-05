// SVG icon constants
const SVG_MOON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const SVG_SUN = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const SVG_TRASH = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const SVG_COMMENT = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

// Get DOM elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const themeToggle = document.getElementById('themeToggle');
const filterBtns = document.querySelectorAll('.filter-btn');
const taskCount = document.getElementById('taskCount');
const categorySelect = document.getElementById('categorySelect');
const categoryFilter = document.getElementById('categoryFilter');

// Configuration
const API_URL = 'http://localhost:3000/api';
const SERVER_TIMEOUT = 5000; // 5 seconds
const COMMENTS_PER_PAGE = 5;

// State management
let todos = [];
let currentFilter = 'all';
let currentCategoryFilter = 'all';
let needsSync = false;
let isSyncing = false;
let serverAvailable = false;

// Migrate existing todos: add category default + init comments array
function migrateTodos(list) {
  if (!Array.isArray(list)) return [];
  const migrated = list.map(item => {
    if (!item.hasOwnProperty('category')) item.category = 'personal';
    if (!Array.isArray(item.comments)) item.comments = [];
    return item;
  });
  localStorage.setItem('todos', JSON.stringify(migrated));
  return migrated;
}

// Load todos from server or fallback to localStorage
async function loadTodosFromServerOrLocal() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVER_TIMEOUT);
    const res = await fetch(`${API_URL}/todos`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const serverTodos = await res.json();
      todos = migrateTodos(Array.isArray(serverTodos) ? serverTodos : []);
      serverAvailable = true;
      localStorage.setItem('todos', JSON.stringify(todos));
      console.log('✓ Loaded todos from server');
      return;
    }
  } catch (err) {
    console.warn('Server unavailable. Loading from localStorage:', err.message);
  }
  serverAvailable = false;
  const raw = JSON.parse(localStorage.getItem('todos')) || [];
  todos = migrateTodos(raw);
  console.log('✓ Loaded todos from localStorage (offline mode)');
}

// Save todos to localStorage and sync with server
async function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
  if (!serverAvailable || isSyncing) { needsSync = true; return; }
  isSyncing = true;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVER_TIMEOUT);
    const res = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todos),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const serverTodos = await res.json();
      todos = migrateTodos(Array.isArray(serverTodos) ? serverTodos : todos);
      localStorage.setItem('todos', JSON.stringify(todos));
      needsSync = false;
      serverAvailable = true;
      console.log('✓ Synced with server');
    } else {
      needsSync = true;
      serverAvailable = false;
    }
  } catch (err) {
    console.warn('Sync failed, working offline:', err.message);
    needsSync = true;
    serverAvailable = false;
  } finally {
    isSyncing = false;
  }
}

// Attempt one-time migration of localStorage data to server
async function attemptMigration() {
  try {
    const localTodos = JSON.parse(localStorage.getItem('todos')) || [];
    if (localTodos.length === 0) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVER_TIMEOUT);
    const res = await fetch(`${API_URL}/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localTodos),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.status === 409) {
      console.log('Server has existing todos; using server data');
      return;
    }
    if (res.ok) { console.log('✓ Migrated local todos to server'); needsSync = false; }
  } catch (err) {
    console.warn('Migration attempt skipped:', err.message);
  }
}

// Initialize theme
(function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.body.classList.add('dark');
    if (themeToggle) { themeToggle.innerHTML = SVG_SUN; themeToggle.setAttribute('aria-pressed', 'true'); }
  } else {
    document.body.classList.remove('dark');
    if (themeToggle) { themeToggle.innerHTML = SVG_MOON; themeToggle.setAttribute('aria-pressed', 'false'); }
  }
})();

// Initialize app
(async function initApp() {
  await loadTodosFromServerOrLocal();
  await attemptMigration();
  setInterval(async () => { if (needsSync && !isSyncing) await saveTodos(); }, 10000);
  renderTodos();
  initKanban();
})();

// Event listeners
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTodo(); });

if (categoryFilter) {
  categoryFilter.addEventListener('change', () => {
    currentCategoryFilter = categoryFilter.value;
    renderTodos();
  });
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? SVG_SUN : SVG_MOON;
    themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  });
}

// Add a new todo
function addTodo() {
  const todoText = todoInput.value.trim();
  if (!todoText) { alert('Please enter a task!'); return; }
  todos.push({
    id: Date.now(),
    text: todoText,
    state: 'plan',
    category: (categorySelect && categorySelect.value) ? categorySelect.value : 'personal',
    comments: []
  });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

// Delete a todo with exit animation
function deleteTodo(id) {
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if (card) {
    card.classList.add('removing');
    card.addEventListener('animationend', () => {
      todos = todos.filter(t => t.id !== id);
      saveTodos();
      renderTodos();
    }, { once: true });
  } else {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
  }
}

// Cycle task state via badge click
function cycleState(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  const states = ['plan', 'todo', 'done'];
  todo.state = states[(states.indexOf(todo.state) + 1) % states.length];
  saveTodos();
  renderTodos();
}

// Update task count display
function updateTaskCount() {
  if (!taskCount) return;
  const total = todos.length;
  const done = todos.filter(t => t.state === 'done').length;
  taskCount.textContent = total === 0 ? '0 tasks' : `${done} of ${total} done`;
  
  // Update filter button counters
  const planCount = todos.filter(t => t.state === 'plan').length;
  const todoCount = todos.filter(t => t.state === 'todo').length;
  const doneCount = todos.filter(t => t.state === 'done').length;
  
  const allBtn = document.querySelector('[data-filter="all"]');
  const planBtn = document.querySelector('[data-filter="plan"]');
  const todoBtn = document.querySelector('[data-filter="todo"]');
  const doneBtn = document.querySelector('[data-filter="done"]');
  
  if (allBtn) allBtn.setAttribute('data-count', total);
  if (planBtn) planBtn.setAttribute('data-count', planCount);
  if (todoBtn) todoBtn.setAttribute('data-count', todoCount);
  if (doneBtn) doneBtn.setAttribute('data-count', doneCount);
}

// ── Kanban board rendering ─────────────────────────────────────────────────

function renderTodos() {
  updateTaskCount();

  // Clear columns
  ['plan', 'todo', 'done'].forEach(state => {
    const col = document.getElementById(`cards-${state}`);
    const countEl = document.getElementById(`count-${state}`);
    if (col) col.innerHTML = '';
    if (countEl) countEl.textContent = '0';
  });

  // Apply filters
  let filtered = currentCategoryFilter === 'all'
    ? todos
    : todos.filter(t => t.category === currentCategoryFilter);

  if (currentFilter !== 'all') {
    filtered = filtered.filter(t => t.state === currentFilter);
  }

  // Group by state and render
  const groups = { plan: [], todo: [], done: [] };
  filtered.forEach(t => { if (groups[t.state]) groups[t.state].push(t); });

  Object.entries(groups).forEach(([state, list]) => {
    const col = document.getElementById(`cards-${state}`);
    const countEl = document.getElementById(`count-${state}`);
    if (!col) return;
    if (countEl) countEl.textContent = list.length;
    list.forEach(todo => col.appendChild(createCard(todo)));
  });
}

// Build a single card element
function createCard(todo) {
  const card = document.createElement('div');
  card.className = `card state-${todo.state}`;
  card.dataset.id = todo.id;
  card.draggable = true;

  // Header: state badge + delete button
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header';

  const stateBadge = document.createElement('span');
  stateBadge.className = 'state-badge';
  stateBadge.textContent = todo.state === 'todo' ? 'To Do'
    : todo.state.charAt(0).toUpperCase() + todo.state.slice(1);
  stateBadge.title = 'Click to advance state';
  stateBadge.addEventListener('click', () => cycleState(todo.id));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = SVG_TRASH;
  deleteBtn.title = 'Delete task';
  deleteBtn.setAttribute('aria-label', 'Delete task');
  deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

  cardHeader.appendChild(stateBadge);
  cardHeader.appendChild(deleteBtn);

  // Task text (inline editable)
  const textSpan = document.createElement('span');
  textSpan.className = 'todo-text';
  textSpan.textContent = todo.text;
  textSpan.contentEditable = true;
  textSpan.setAttribute('aria-label', 'Edit task text');
  textSpan.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); textSpan.blur(); } });
  textSpan.addEventListener('blur', async () => {
    const newText = textSpan.textContent.trim();
    if (!newText) { textSpan.textContent = todo.text; return; }
    if (newText !== todo.text) {
      const t = todos.find(t => t.id === todo.id);
      if (t) { t.text = newText; await saveTodos(); renderTodos(); }
    }
  });

  // Category inline select
  const catSelect = document.createElement('select');
  catSelect.className = 'category-select';
  ['trabajo', 'personal', 'estudio'].forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.text = c.charAt(0).toUpperCase() + c.slice(1);
    if (todo.category === c) opt.selected = true;
    catSelect.appendChild(opt);
  });
  catSelect.addEventListener('change', async () => {
    const t = todos.find(t => t.id === todo.id);
    if (t) { t.category = catSelect.value; await saveTodos(); renderTodos(); }
  });

  // Comments section
  const comments = Array.isArray(todo.comments) ? todo.comments : [];

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'toggle-comments-btn';
  toggleBtn.innerHTML = `${SVG_COMMENT} ${comments.length} comment${comments.length !== 1 ? 's' : ''}`;

  const commentsSection = document.createElement('div');
  commentsSection.className = 'comments-section';
  commentsSection.hidden = true;

  const commentsList = document.createElement('div');
  commentsList.className = 'comments-list';

  const paginationEl = document.createElement('div');
  paginationEl.className = 'comment-pagination';

  let currentPage = 1;

  function renderComments() {
    commentsList.innerHTML = '';
    const visible = comments.slice(0, currentPage * COMMENTS_PER_PAGE);
    // Show newest first
    [...visible].reverse().forEach(c => {
      const commentEl = document.createElement('div');
      commentEl.className = 'comment';
      const textEl = document.createElement('span');
      textEl.className = 'comment-text';
      textEl.textContent = c.text;
      const dateEl = document.createElement('time');
      dateEl.className = 'comment-date';
      dateEl.textContent = new Date(c.date).toLocaleString();
      commentEl.appendChild(textEl);
      commentEl.appendChild(dateEl);
      commentsList.appendChild(commentEl);
    });
    // Pagination: load older comments
    paginationEl.innerHTML = '';
    if (comments.length > visible.length) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.className = 'load-more-btn';
      loadMoreBtn.textContent = `Load older (${comments.length - visible.length} remaining)`;
      loadMoreBtn.addEventListener('click', () => { currentPage++; renderComments(); });
      paginationEl.appendChild(loadMoreBtn);
    }
  }

  const commentInputArea = document.createElement('div');
  commentInputArea.className = 'comment-input-area';

  const commentInput = document.createElement('input');
  commentInput.className = 'comment-input';
  commentInput.placeholder = 'Add a comment...';
  commentInput.type = 'text';

  const addCommentBtn = document.createElement('button');
  addCommentBtn.className = 'add-comment-btn';
  addCommentBtn.textContent = 'Post';

  async function postComment() {
    const text = commentInput.value.trim();
    if (!text) return;
    const t = todos.find(t => t.id === todo.id);
    if (t) {
      if (!Array.isArray(t.comments)) t.comments = [];
      t.comments.push({ text, date: new Date().toISOString() });
      commentInput.value = '';
      comments.splice(0, comments.length, ...t.comments);
      toggleBtn.innerHTML = `${SVG_COMMENT} ${comments.length} comment${comments.length !== 1 ? 's' : ''}`;
      renderComments();
      await saveTodos();
    }
  }

  addCommentBtn.addEventListener('click', postComment);
  commentInput.addEventListener('keypress', e => { if (e.key === 'Enter') postComment(); });

  commentInputArea.appendChild(commentInput);
  commentInputArea.appendChild(addCommentBtn);
  commentsSection.appendChild(commentsList);
  commentsSection.appendChild(paginationEl);
  commentsSection.appendChild(commentInputArea);
  renderComments();

  toggleBtn.addEventListener('click', () => {
    commentsSection.hidden = !commentsSection.hidden;
    toggleBtn.classList.toggle('active', !commentsSection.hidden);
  });

  // Drag events
  card.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', String(todo.id));
    setTimeout(() => card.classList.add('dragging'), 0);
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
  });

  card.appendChild(cardHeader);
  card.appendChild(textSpan);
  card.appendChild(catSelect);
  card.appendChild(toggleBtn);
  card.appendChild(commentsSection);

  return card;
}

// Attach drag-and-drop handlers to each column
function initKanban() {
  ['plan', 'todo', 'done'].forEach(state => {
    const colEl = document.getElementById(`cards-${state}`);
    if (!colEl) return;
    const column = colEl.closest('.kanban-column');

    colEl.addEventListener('dragover', e => {
      e.preventDefault();
      if (column) column.classList.add('drag-over');
    });

    colEl.addEventListener('dragleave', e => {
      if (column && !colEl.contains(e.relatedTarget)) {
        column.classList.remove('drag-over');
      }
    });

    colEl.addEventListener('drop', async e => {
      e.preventDefault();
      if (column) column.classList.remove('drag-over');
      const id = Number(e.dataTransfer.getData('text/plain'));
      const t = todos.find(t => t.id === id);
      if (t && t.state !== state) {
        t.state = state;
        await saveTodos();
        renderTodos();
      }
    });
  });
}
