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
        this.categorySelect = document.getElementById('categorySelect');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.filterSelect = document.getElementById('filterSelect');
        this.exportBtn = document.getElementById('exportBtn');
    }

    attachEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.filterSelect.addEventListener('change', () => this.filterTasks());
        this.exportBtn.addEventListener('click', () => this.exportTasks());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            category: this.categorySelect.value,
            priority: this.prioritySelect.value,
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
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.taskList.style.display = 'none';
            this.emptyState.style.display = 'block';
            return;
        }

        this.taskList.style.display = 'block';
        this.emptyState.style.display = 'none';

        // Sort tasks by priority (high -> medium -> low) then by creation date
        const sortedTasks = filteredTasks.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority] || 2;
            const bPriority = priorityOrder[b.priority] || 2;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Higher priority first
            }
            return new Date(b.createdAt) - new Date(a.createdAt); // Newer first
        });

        this.taskList.innerHTML = sortedTasks.map(task => {
            const categoryIcons = {
                personal: '🏠',
                work: '💼',
                health: '🏃',
                learning: '📚'
            };
            
            const priorityLabels = {
                high: '🔥 High',
                medium: '📋 Normal',
                low: '📝 Low'
            };

            return `
                <li class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority || 'medium'}">
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        ${task.completed ? 'checked' : ''}
                        onchange="taskTracker.toggleTask(${task.id})"
                    >
                    <div class="task-content">
                        <span class="task-text">${this.escapeHtml(task.text)}</span>
                        <div class="task-meta">
                            <span class="task-category">${categoryIcons[task.category] || '🏠'} ${task.category || 'personal'}</span>
                            <span class="task-priority ${task.priority || 'medium'}">${priorityLabels[task.priority] || '📋 Normal'}</span>
                            <span class="task-date">${this.formatDate(task.createdAt)}</span>
                        </div>
                    </div>
                    <button 
                        class="task-delete" 
                        onclick="taskTracker.deleteTask(${task.id})"
                        title="Delete task"
                    >
                        Delete
                    </button>
                </li>
            `;
        }).join('');
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
        // Enhanced streak calculation
        const completedTasks = this.tasks.filter(t => t.completed && t.completedAt);
        if (completedTasks.length === 0) return 0;
        
        // Group by date
        const tasksByDate = {};
        completedTasks.forEach(task => {
            const date = new Date(task.completedAt).toDateString();
            if (!tasksByDate[date]) tasksByDate[date] = 0;
            tasksByDate[date]++;
        });
        
        const dates = Object.keys(tasksByDate).sort((a, b) => new Date(b) - new Date(a));
        let streak = 0;
        const today = new Date().toDateString();
        
        // Check if there are tasks completed today or yesterday
        if (dates[0] === today || (dates[0] === new Date(Date.now() - 86400000).toDateString())) {
            streak = 1;
            
            // Count consecutive days
            for (let i = 1; i < dates.length; i++) {
                const currentDate = new Date(dates[i-1]);
                const nextDate = new Date(dates[i]);
                const dayDiff = (currentDate - nextDate) / (1000 * 60 * 60 * 24);
                
                if (dayDiff === 1) {
                    streak++;
                } else {
                    break;
                }
            }
        }
        
        return streak;
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

    getFilteredTasks() {
        const filter = this.filterSelect.value;
        
        if (filter === 'all') return this.tasks;
        if (filter === 'pending') return this.tasks.filter(t => !t.completed);
        if (filter === 'completed') return this.tasks.filter(t => t.completed);
        if (filter === 'high') return this.tasks.filter(t => t.priority === 'high');
        
        // Category filters
        return this.tasks.filter(t => t.category === filter);
    }

    filterTasks() {
        this.render();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = today - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }

    handleKeyboardShortcuts(e) {
        // Only trigger shortcuts if not typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        
        if (e.ctrlKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            this.taskInput.focus();
        }
        
        if (e.ctrlKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            this.exportTasks();
        }
        
        if (e.key === 'Escape') {
            this.taskInput.blur();
        }
    }

    exportTasks() {
        const data = {
            tasks: this.tasks,
            exportDate: new Date().toISOString(),
            stats: {
                total: this.tasks.length,
                completed: this.tasks.filter(t => t.completed).length,
                streak: this.calculateStreak()
            }
        };

        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message
        this.showExportSuccess();
    }

    showExportSuccess() {
        const message = document.createElement('div');
        message.innerHTML = '✅ Tasks exported successfully!';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Add animation if not already added
        if (!document.querySelector('#export-style')) {
            const style = document.createElement('style');
            style.id = 'export-style';
            style.textContent = `
                @keyframes slideInRight {
                    0% { transform: translateX(100%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(message);
        setTimeout(() => {
            message.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => document.body.removeChild(message), 300);
        }, 3000);
    }
}

// Initialize the app when the page loads
const taskTracker = new TaskTracker();