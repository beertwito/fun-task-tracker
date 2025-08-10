class TaskTracker {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.initializeElements();
        this.attachEventListeners();
        this.render();
        this.updateStats();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.streakCountEl = document.getElementById('streakCount');
    }

    attachEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveToStorage();
        this.taskInput.value = '';
        this.render();
        this.updateStats();
        
        // Add a little celebration animation
        this.addTaskBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.addTaskBtn.style.transform = '';
        }, 150);
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveToStorage();
            this.render();
            this.updateStats();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToStorage();
        this.render();
        this.updateStats();
    }

    render() {
        if (this.tasks.length === 0) {
            this.taskList.style.display = 'none';
            this.emptyState.style.display = 'block';
            return;
        }

        this.taskList.style.display = 'block';
        this.emptyState.style.display = 'none';

        this.taskList.innerHTML = this.tasks.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="taskTracker.toggleTask(${task.id})"
                >
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <button 
                    class="task-delete" 
                    onclick="taskTracker.deleteTask(${task.id})"
                    title="Delete task"
                >
                    Delete
                </button>
            </li>
        `).join('');
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const streak = this.calculateStreak();

        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.streakCountEl.textContent = streak;
    }

    calculateStreak() {
        // Simple streak calculation - count consecutive days with completed tasks
        const today = new Date().toDateString();
        const completedToday = this.tasks.some(t => 
            t.completed && 
            t.completedAt && 
            new Date(t.completedAt).toDateString() === today
        );
        
        return completedToday ? 1 : 0; // We'll enhance this in later phases
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveToStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

// Initialize the app when the page loads
const taskTracker = new TaskTracker();