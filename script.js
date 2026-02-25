// Get DOM elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const themeToggle = document.getElementById('themeToggle');
const filterBtns = document.querySelectorAll('.filter-btn');

// State management
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';

// initialize theme based on storage or system preference
(function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
        document.body.classList.add('dark');
        if (themeToggle) themeToggle.textContent = '☀️';
        if (themeToggle) themeToggle.setAttribute('aria-pressed', 'true');
    } else {
        document.body.classList.remove('dark');
        if (themeToggle) themeToggle.textContent = '🌙';
        if (themeToggle) themeToggle.setAttribute('aria-pressed', 'false');
    }
})();

// Add todo on button click
addBtn.addEventListener('click', addTodo);

// Filter button handlers
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTodos();
    });
});

// theme toggle handler
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    });
}

// Add todo on Enter key press
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

// Function to add a new todo
function addTodo() {
    const todoText = todoInput.value.trim();
    
    if (todoText === '') {
        alert('Please enter a task!');
        return;
    }
    
    const todo = {
        id: Date.now(),
        text: todoText,
        state: 'plan'
    };
    
    todos.push(todo);
    saveTodos();
    renderTodos();
    
    todoInput.value = '';
    todoInput.focus();
}

// Function to delete a todo
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

// Function to cycle task state
function cycleState(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const states = ['plan', 'todo', 'done'];
    const currentIndex = states.indexOf(todo.state);
    todo.state = states[(currentIndex + 1) % states.length];
    
    saveTodos();
    renderTodos();
}

// Save todos to localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Render todos based on current filter
function renderTodos() {
    todoList.innerHTML = '';
    
    const filteredTodos = currentFilter === 'all' 
        ? todos 
        : todos.filter(todo => todo.state === currentFilter);
    
    filteredTodos.forEach(todo => {
        const todoItem = document.createElement('li');
        todoItem.className = `todo-item state-${todo.state}`;
        
        // State badge
        const stateBadge = document.createElement('span');
        stateBadge.className = 'state-badge';
        stateBadge.textContent = todo.state === 'todo' ? 'To Do' : todo.state.charAt(0).toUpperCase() + todo.state.slice(1);
        stateBadge.addEventListener('click', () => cycleState(todo.id));
        
        // Text span
        const textSpan = document.createElement('span');
        textSpan.className = 'todo-text';
        textSpan.textContent = todo.text;
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
        
        todoItem.appendChild(stateBadge);
        todoItem.appendChild(textSpan);
        todoItem.appendChild(deleteBtn);
        todoList.appendChild(todoItem);
    });
}

// Initialize app
renderTodos();
