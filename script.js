// Get DOM elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');

// Add todo on button click
addBtn.addEventListener('click', addTodo);

// Add todo on Enter key press
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

// Function to add a new todo
function addTodo() {
    const todoText = todoInput.value.trim();
    
    // Check if input is not empty
    if (todoText === '') {
        alert('Please enter a todo!');
        return;
    }
    
    // Create todo item
    const todoItem = document.createElement('li');
    todoItem.className = 'todo-item';
    
    // Create text span
    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.textContent = todoText;
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
        todoItem.remove();
    });

    // toggle completed when text clicked
    textSpan.addEventListener('click', () => {
        textSpan.classList.toggle('completed');
    });
    
    // Append elements
    todoItem.appendChild(textSpan);
    todoItem.appendChild(deleteBtn);
    todoList.appendChild(todoItem);
    
    // Clear input
    todoInput.value = '';
    todoInput.focus();
}
