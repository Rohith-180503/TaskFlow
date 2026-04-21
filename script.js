// DOM Elements
const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');
const themeToggle = document.getElementById('theme-toggle');
const clearCompleted = document.getElementById('clear-completed');
const prioritySelect = document.getElementById('priority-select');
const emptyState = document.getElementById('empty-state');
const toastContainer = document.getElementById('toast-container');

let todos = JSON.parse(localStorage.getItem('todos')) || [];

// Load saved theme
if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Create a task item
function createTodoNode(todo, index) {
    const li = document.createElement('li');
    li.classList.add(todo.priority.toLowerCase());

    const left = document.createElement('div');
    left.className = 'todo-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => {
        todo.completed = checkbox.checked;
        textSpan.classList.toggle('completed', todo.completed);
        saveTodos();
        if (todo.completed && window.confetti) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    });

    const textSpan = document.createElement('span');
    if (window.marked && window.DOMPurify) {
        textSpan.innerHTML = DOMPurify.sanitize(marked.parseInline(todo.text));
    } else {
        textSpan.textContent = todo.text;
    }
    if(todo.completed) textSpan.classList.add('completed');

    // Inline editing
    textSpan.addEventListener('dblclick', () => {
        const inputEdit = document.createElement('input');
        inputEdit.type = 'text';
        inputEdit.value = todo.text;
        li.replaceChild(inputEdit, textSpan);
        inputEdit.focus();
        inputEdit.addEventListener('keydown', e => {
            if(e.key === 'Enter') {
                todo.text = inputEdit.value.trim();
                render();
                saveTodos();
            }
        });
    });

    left.appendChild(checkbox);
    left.appendChild(textSpan);

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const delBtn = document.createElement('button');
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.className = 'delete';
    delBtn.addEventListener('click', () => {
        const deletedTodo = todos[index];
        todos.splice(index, 1);
        render();
        saveTodos();
        showUndoToast(deletedTodo, index);
    });

    actions.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(actions);
    return li;
}

// Render tasks
function render() {
    list.innerHTML = '';
    todos.forEach((todo, i) => list.appendChild(createTodoNode(todo, i)));
    
    if (todos.length === 0) {
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
    }
}

// Toast Undo Logic
function showUndoToast(deletedTodo, originalIndex) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const text = document.createElement('span');
    text.textContent = 'Task deleted';
    
    const undoBtn = document.createElement('button');
    undoBtn.className = 'toast-undo-btn';
    undoBtn.textContent = 'Undo';
    
    toast.appendChild(text);
    toast.appendChild(undoBtn);
    toastContainer.appendChild(toast);
    
    let isUndone = false;
    
    const timeoutId = setTimeout(() => {
        if (!isUndone) {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
    
    undoBtn.addEventListener('click', () => {
        isUndone = true;
        clearTimeout(timeoutId);
        
        // Restore task safely by adding at the end if originalIndex is out of bounds
        const indexToInsert = Math.min(originalIndex, todos.length);
        todos.splice(indexToInsert, 0, deletedTodo);
        render();
        saveTodos();
        
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    });
}

// Add task
function addTodo() {
    const text = input.value.trim();
    if(!text) return;
    todos.push({ text, completed: false, priority: prioritySelect.value });
    input.value = '';
    render();
    saveTodos();
}

// Event Listeners
addBtn.addEventListener('click', addTodo);
input.addEventListener('keydown', e => { if(e.key === 'Enter') addTodo(); });
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
});
clearCompleted.addEventListener('click', () => {
    todos = todos.filter(t => !t.completed);
    render();
    saveTodos();
});

// Initial render
render();