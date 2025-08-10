class TaskTracker {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.theme = localStorage.getItem('theme') || 'light';
        this.initializeElements();
        this.attachEventListeners();
        this.initializeTheme();
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
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        this.progressFill = document.getElementById('progressFill');
        this.progressPercent = document.getElementById('progressPercent');
    }

    attachEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
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
            
            // Play completion sound and show celebration
            if (task.completed) {
                this.playCompletionSound();
                this.showCelebration();
            }
        }
    }

    deleteTask(id) {
        const taskElement = document.querySelector(`[onclick="taskTracker.deleteTask(${id})"]`).parentElement;
        taskElement.classList.add('removing');
        
        setTimeout(() => {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveToStorage();
            this.render();
            this.updateStats();
        }, 300);
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
        const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.streakCountEl.textContent = streak;
        
        // Update progress bar with animation
        this.progressPercent.textContent = `${progressPercent}%`;
        this.progressFill.style.width = `${progressPercent}%`;
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

    initializeTheme() {
        document.body.classList.toggle('dark-theme', this.theme === 'dark');
        this.themeIcon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.body.classList.toggle('dark-theme', this.theme === 'dark');
        this.themeIcon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', this.theme);
    }

    playCompletionSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    showCelebration() {
        // Create a temporary celebration element
        const celebration = document.createElement('div');
        celebration.innerHTML = '🎉';
        celebration.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3em;
            animation: celebrationBounce 0.6s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Add celebration animation CSS if not already added
        if (!document.querySelector('#celebration-style')) {
            const style = document.createElement('style');
            style.id = 'celebration-style';
            style.textContent = `
                @keyframes celebrationBounce {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(celebration);
        setTimeout(() => document.body.removeChild(celebration), 600);
    }
}

// Initialize the app when the page loads
const taskTracker = new TaskTracker();