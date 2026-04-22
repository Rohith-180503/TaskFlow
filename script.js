// Constants
const STORAGE_KEYS = {
    TODOS: 'todos',
    THEME: 'theme'
};

const PRIORITY_ORDER = {
    High: 3,
    Medium: 2,
    Low: 1
};

const MAX_TODO_LENGTH = 200;

// DOM Elements
const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');
const themeToggle = document.getElementById('theme-toggle');
const clearCompleted = document.getElementById('clear-completed');
const prioritySelect = document.getElementById('priority-select');
const emptyState = document.getElementById('empty-state');
const emptyStateText = emptyState.querySelector('p');
const toastContainer = document.getElementById('toast-container');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-select');
const taskCounter = document.getElementById('task-counter');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let todos = loadTodos();
let currentFilter = 'all';
let currentSort = 'newest';

function generateId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTodo(todo) {
    const text = String(todo?.text || '').trim().slice(0, MAX_TODO_LENGTH);
    if (!text) return null;

    return {
        id: todo?.id || generateId(),
        text,
        completed: Boolean(todo?.completed),
        priority: PRIORITY_ORDER[todo?.priority] ? todo.priority : 'Low',
        createdAt: Number.isFinite(todo?.createdAt) ? todo.createdAt : Date.now()
    };
}

function loadTodos() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.TODOS);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.map(normalizeTodo).filter(Boolean);
    } catch {
        return [];
    }
}

function saveTodos() {
    localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
}

function setTheme(isDark) {
    document.body.classList.toggle('dark-theme', isDark);
    themeToggle.setAttribute('aria-pressed', String(isDark));
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
}

function initializeTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    setTheme(savedTheme === 'dark');
}

function isDuplicateText(text, excludeId = null) {
    const normalized = text.toLowerCase();
    return todos.some(todo => todo.id !== excludeId && todo.text.toLowerCase() === normalized);
}

function getTodoIndexById(id) {
    return todos.findIndex(todo => todo.id === id);
}

function parseMarkdown(text) {
    if (window.marked && window.DOMPurify) {
        return DOMPurify.sanitize(marked.parseInline(text));
    }

    const span = document.createElement('span');
    span.textContent = text;
    return span.innerHTML;
}

function triggerConfetti() {
    if (!window.confetti || prefersReducedMotion) return;

    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function showToast(message, options = {}) {
    const { actionLabel = '', onAction = null, duration = 5000 } = options;

    const toast = document.createElement('div');
    toast.className = 'toast';

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    function dismissToast() {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }

    const timeoutId = setTimeout(dismissToast, duration);

    if (actionLabel && typeof onAction === 'function') {
        const actionBtn = document.createElement('button');
        actionBtn.className = 'toast-undo-btn';
        actionBtn.textContent = actionLabel;

        actionBtn.addEventListener('click', () => {
            clearTimeout(timeoutId);
            onAction();
            dismissToast();
        });

        toast.appendChild(actionBtn);
    }

    toastContainer.appendChild(toast);
}

function getVisibleTodos() {
    const filtered = todos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });

    const sorted = [...filtered].sort((a, b) => {
        switch (currentSort) {
            case 'oldest':
                return a.createdAt - b.createdAt;
            case 'priority-high':
                return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
            case 'priority-low':
                return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
            case 'newest':
            default:
                return b.createdAt - a.createdAt;
        }
    });

    return sorted;
}

function updateCounter() {
    const total = todos.length;
    const active = todos.filter(todo => !todo.completed).length;
    taskCounter.textContent = `${active} active • ${total} total`;
}

function createTodoNode(todo) {
    const li = document.createElement('li');
    li.dataset.id = todo.id;
    li.classList.add(todo.priority.toLowerCase());

    const left = document.createElement('div');
    left.className = 'todo-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.className = 'todo-checkbox';
    checkbox.setAttribute('aria-label', `Mark task as completed: ${todo.text}`);

    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.tabIndex = 0;
    textSpan.setAttribute('title', 'Double click to edit');
    textSpan.innerHTML = parseMarkdown(todo.text);

    if (todo.completed) {
        textSpan.classList.add('completed');
    }

    left.appendChild(checkbox);
    left.appendChild(textSpan);

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete';
    delBtn.dataset.action = 'delete';
    delBtn.setAttribute('aria-label', `Delete task: ${todo.text}`);
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';

    actions.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(actions);

    return li;
}

function render() {
    const visibleTodos = getVisibleTodos();
    list.innerHTML = '';

    const fragment = document.createDocumentFragment();
    visibleTodos.forEach(todo => fragment.appendChild(createTodoNode(todo)));
    list.appendChild(fragment);

    if (visibleTodos.length === 0) {
        emptyState.style.display = 'flex';
        emptyStateText.textContent = todos.length
            ? 'No tasks match this filter.'
            : 'All caught up! Time to relax or add a new task.';
    } else {
        emptyState.style.display = 'none';
    }

    updateCounter();
}

function addTodo() {
    const text = input.value.trim();

    if (!text) {
        showToast('Task cannot be empty.');
        return;
    }

    if (text.length > MAX_TODO_LENGTH) {
        showToast(`Task must be ${MAX_TODO_LENGTH} characters or less.`);
        return;
    }

    if (isDuplicateText(text)) {
        showToast('Task already exists.');
        return;
    }

    todos.push({
        id: generateId(),
        text,
        completed: false,
        priority: prioritySelect.value,
        createdAt: Date.now()
    });

    input.value = '';
    input.focus();
    saveTodos();
    render();
}

function startInlineEdit(todoId, textElement) {
    const todoIndex = getTodoIndexById(todoId);
    if (todoIndex === -1) return;

    const todo = todos[todoIndex];
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.value = todo.text;
    editInput.maxLength = MAX_TODO_LENGTH;
    editInput.className = 'inline-edit-input';
    editInput.setAttribute('aria-label', 'Edit task text');

    const parent = textElement.parentElement;
    parent.replaceChild(editInput, textElement);
    editInput.focus();
    editInput.select();

    let finished = false;

    const cancelEdit = () => {
        if (finished) return;
        finished = true;
        render();
    };

    const saveEdit = () => {
        if (finished) return;

        const nextText = editInput.value.trim();
        if (!nextText) {
            showToast('Task text cannot be empty.');
            return cancelEdit();
        }

        if (isDuplicateText(nextText, todo.id)) {
            showToast('Another task with the same text already exists.');
            return cancelEdit();
        }

        finished = true;
        todos[todoIndex].text = nextText;
        saveTodos();
        render();
    };

    editInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') saveEdit();
        if (event.key === 'Escape') cancelEdit();
    });

    editInput.addEventListener('blur', saveEdit);
}

function removeTodo(todoId) {
    const index = getTodoIndexById(todoId);
    if (index === -1) return;

    const [deletedTodo] = todos.splice(index, 1);
    saveTodos();
    render();

    showToast('Task deleted', {
        actionLabel: 'Undo',
        onAction: () => {
            const indexToInsert = Math.min(index, todos.length);
            todos.splice(indexToInsert, 0, deletedTodo);
            saveTodos();
            render();
        }
    });
}

function clearCompletedTodos() {
    const removed = [];

    todos.forEach((todo, index) => {
        if (todo.completed) {
            removed.push({ todo, index });
        }
    });

    if (removed.length === 0) {
        showToast('No completed tasks to clear.');
        return;
    }

    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    render();

    showToast(`Cleared ${removed.length} completed task${removed.length > 1 ? 's' : ''}.`, {
        actionLabel: 'Undo',
        onAction: () => {
            removed
                .sort((a, b) => a.index - b.index)
                .forEach(({ todo, index }) => {
                    const insertIndex = Math.min(index, todos.length);
                    todos.splice(insertIndex, 0, todo);
                });

            saveTodos();
            render();
        }
    });
}

// Event Listeners
addBtn.addEventListener('click', addTodo);

input.addEventListener('keydown', event => {
    if (event.key === 'Enter') addTodo();
});

themeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-theme');
    setTheme(isDark);
});

clearCompleted.addEventListener('click', clearCompletedTodos);

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        render();
    });
});

sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    render();
});

list.addEventListener('change', event => {
    const checkbox = event.target.closest('.todo-checkbox');
    if (!checkbox) return;

    const todoId = checkbox.closest('li')?.dataset.id;
    const todoIndex = getTodoIndexById(todoId);
    if (todoIndex === -1) return;

    todos[todoIndex].completed = checkbox.checked;
    saveTodos();
    render();

    if (checkbox.checked) {
        triggerConfetti();
    }
});

list.addEventListener('click', event => {
    const deleteButton = event.target.closest('button[data-action="delete"]');
    if (!deleteButton) return;

    const todoId = deleteButton.closest('li')?.dataset.id;
    removeTodo(todoId);
});

list.addEventListener('dblclick', event => {
    const textElement = event.target.closest('.todo-text');
    if (!textElement) return;

    const todoId = textElement.closest('li')?.dataset.id;
    startInlineEdit(todoId, textElement);
});

list.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;

    const textElement = event.target.closest('.todo-text');
    if (!textElement) return;

    const todoId = textElement.closest('li')?.dataset.id;
    startInlineEdit(todoId, textElement);
});

// Initial setup
initializeTheme();
render();