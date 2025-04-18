class AIManager {
    constructor() {
        this.userPatterns = JSON.parse(localStorage.getItem('userPatterns')) || {
            tasksByHour: {},
            completionRates: {},
            commonTasks: {},
            taskCategories: {}
        };
        this.dailyStats = {
            tasksAdded: 0,
            tasksCompleted: 0,
            productiveHours: new Set()
        };
        this.taskHistory = JSON.parse(localStorage.getItem('taskHistory') || '[]');
        this.lastCheckIn = localStorage.getItem('lastCheckIn');
        this.API_KEY = 'AIzaSyD0Cl3Tp4nL-XcIfhHiZwwSQclh9n8oXD8'; // Replace with your actual API key
        this.initialize();
    }

    async initialize() {
        await this.morningCheckIn();
        this.setupNotifications();
    }

    async morningCheckIn() {
        const today = new Date().toDateString();
        if (this.lastCheckIn === today) return;

        const yesterdayTasks = this.getYesterdayTasks();
        const isWeekend = [0, 6].includes(new Date().getDay());

        if (yesterdayTasks.length > 0) {
            const followYesterday = await this.showNotification(
                'Morning Check-In',
                'Would you like to follow yesterday\'s schedule?',
                ['Yes', 'No']
            );

            if (followYesterday === 'Yes') {
                this.replicateYesterdaySchedule(yesterdayTasks);
            } else {
                await this.generateNewSuggestions(isWeekend);
            }
        } else {
            await this.generateNewSuggestions(isWeekend);
        }

        this.lastCheckIn = today;
        localStorage.setItem('lastCheckIn', today);
    }

    getYesterdayTasks() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return this.taskHistory.filter(task => 
            new Date(task.date).toDateString() === yesterday.toDateString()
        );
    }

    async generateNewSuggestions(isWeekend) {
        const prompt = this.generatePrompt(isWeekend);
        try {
            const suggestions = await this.fetchAISuggestions(prompt);
            this.integrateSuggestions(suggestions, isWeekend);
        } catch (error) {
            console.error('Error generating suggestions:', error);
            this.showFallbackSuggestions(isWeekend);
        }
    }

    generatePrompt(isWeekend) {
        if (Object.keys(this.userPatterns).length === 0) {
            return isWeekend 
                ? "Suggest 3 relaxing or personal growth tasks for the weekend."
                : "Suggest 3 productive tasks for a new user's daily routine.";
        }

        return `Based on the user's patterns: ${JSON.stringify(this.userPatterns)}, 
                suggest ${isWeekend ? 'relaxing weekend' : 'productive daily'} tasks 
                considering their completion rate of ${this.calculateCompletionRate()}%`;
    }

    async fetchAISuggestions(prompt) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: this.generateGeminiPrompt(prompt)
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch suggestions from Gemini API');
            }

            const data = await response.json();
            return this.processGeminiResponse(data);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return this.getFallbackSuggestions();
        }
    }

    generateGeminiPrompt(prompt) {
        const context = {
            userPatterns: this.userPatterns,
            completionRate: this.calculateCompletionRate(),
            isWeekend: [0, 6].includes(new Date().getDay()),
            currentTime: new Date().getHours()
        };

        return `You are a productivity assistant helping with daily task planning. 
                User context: ${JSON.stringify(context)}
                Generate 3-5 specific, actionable tasks that would be appropriate for the user's current situation.
                Format each task as a JSON object with the following structure:
                {
                    "task": "specific task description",
                    "priority": "high/medium/low",
                    "estimatedDuration": "time in minutes",
                    "category": "work/health/personal/other"
                }
                Return only the JSON array of tasks, no additional text.`;
    }

    processGeminiResponse(data) {
        try {
            // Extract the generated text from Gemini's response
            const generatedText = data.candidates[0].content.parts[0].text;
            
            // Remove markdown code block formatting if present
            const cleanJson = generatedText
                .replace(/```json\n?/g, '')  // Remove opening ```json
                .replace(/```\n?/g, '')      // Remove closing ```
                .trim();                     // Remove any extra whitespace
            
            // Parse the JSON array from the response
            const suggestions = JSON.parse(cleanJson);
            
            // Validate and clean the suggestions
            return suggestions.map(suggestion => ({
                task: suggestion.task.trim(),
                priority: suggestion.priority.toLowerCase(),
                estimatedDuration: parseInt(suggestion.estimatedDuration) || 30,
                category: suggestion.category.toLowerCase()
            }));
        } catch (error) {
            console.error('Error processing Gemini response:', error);
            return this.getFallbackSuggestions();
        }
    }

    getFallbackSuggestions() {
        const isWeekend = [0, 6].includes(new Date().getDay());
        const currentHour = new Date().getHours();
        
        if (isWeekend) {
            return [
                {
                    task: "Take a 30-minute walk outside",
                    priority: "medium",
                    estimatedDuration: 30,
                    category: "health"
                },
                {
                    task: "Read a book for 1 hour",
                    priority: "low",
                    estimatedDuration: 60,
                    category: "personal"
                }
            ];
        }

        // Weekday suggestions based on time of day
        if (currentHour < 12) {
            return [
                {
                    task: "Review and prioritize today's tasks",
                    priority: "high",
                    estimatedDuration: 15,
                    category: "work"
                },
                {
                    task: "Take a 5-minute stretch break",
                    priority: "medium",
                    estimatedDuration: 5,
                    category: "health"
                }
            ];
        } else if (currentHour < 17) {
            return [
                {
                    task: "Take a 10-minute break and hydrate",
                    priority: "medium",
                    estimatedDuration: 10,
                    category: "health"
                },
                {
                    task: "Review progress on current tasks",
                    priority: "high",
                    estimatedDuration: 15,
                    category: "work"
                }
            ];
        } else {
            return [
                {
                    task: "Plan tasks for tomorrow",
                    priority: "high",
                    estimatedDuration: 20,
                    category: "work"
                },
                {
                    task: "Reflect on today's achievements",
                    priority: "medium",
                    estimatedDuration: 10,
                    category: "personal"
                }
            ];
        }
    }

    integrateSuggestions(suggestions, isWeekend) {
        suggestions.forEach(suggestion => {
            const optimalHour = this.findOptimalHour(suggestion, isWeekend);
            this.addSuggestionToBlock(suggestion, optimalHour);
        });
    }

    findOptimalHour(suggestion, isWeekend) {
        // Analyze user patterns to find the best hour for this type of task
        const hourPatterns = this.userPatterns.hours || {};
        const currentHour = new Date().getHours();
        
        // For new users or no patterns, use reasonable defaults
        if (Object.keys(hourPatterns).length === 0) {
            return isWeekend ? currentHour : this.getDefaultWorkHour(suggestion);
        }

        // Find the hour with highest success rate for similar tasks
        return Object.entries(hourPatterns)
            .sort(([, a], [, b]) => b.successRate - a.successRate)[0][0];
    }

    getDefaultWorkHour(suggestion) {
        const hour = new Date().getHours();
        if (suggestion.toLowerCase().includes('morning')) return 9;
        if (suggestion.toLowerCase().includes('afternoon')) return 14;
        if (suggestion.toLowerCase().includes('evening')) return 18;
        return hour;
    }

    addSuggestionToBlock(suggestion, hour) {
        const block = document.querySelector(`.hour-block[data-hour="${hour}:00"]`);
        if (!block) return;

        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'ai-suggestion';
        suggestionDiv.innerHTML = `
            <span>${suggestion}</span>
            <div class="suggestion-actions">
                <button class="confirm-suggestion">✓</button>
                <button class="reject-suggestion">✗</button>
            </div>
        `;

        block.querySelector('.task-list').appendChild(suggestionDiv);
    }

    setupNotifications() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.scheduleNotifications();
                }
            });
        }
    }

    scheduleNotifications() {
        // Morning check-in
        this.scheduleNotification(9, 0, 'Morning Check-In', 'Time to plan your day!');
        
        // Midday adjustment
        this.scheduleNotification(14, 0, 'Midday Check-In', 'How\'s your progress? Time for adjustments?');
        
        // Evening reflection
        this.scheduleNotification(18, 0, 'Evening Reflection', 'Would you like to track today\'s progress?');
    }

    scheduleNotification(hour, minute, title, body) {
        const now = new Date();
        const notificationTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hour,
            minute
        );

        if (notificationTime > now) {
            setTimeout(() => {
                new Notification(title, { body });
            }, notificationTime - now);
        }
    }

    async showNotification(title, body, actions = []) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, { 
                body,
                actions: actions.map(action => ({ action, title: action }))
            });

            return new Promise(resolve => {
                notification.onclick = () => {
                    const action = notification.actions[0];
                    resolve(action ? action.action : null);
                };
            });
        }
        return null;
    }

    calculateCompletionRate() {
        const completed = this.taskHistory.filter(task => task.completed).length;
        const total = this.taskHistory.length;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    updateUserPatterns({ hour, text, completed }) {
        // Update tasks by hour
        if (!this.userPatterns.tasksByHour[hour]) {
            this.userPatterns.tasksByHour[hour] = [];
        }
        this.userPatterns.tasksByHour[hour].push({
            text,
            timestamp: Date.now(),
            completed
        });

        // Update completion rates
        if (!this.userPatterns.completionRates[hour]) {
            this.userPatterns.completionRates[hour] = { total: 0, completed: 0 };
        }
        this.userPatterns.completionRates[hour].total++;
        if (completed) {
            this.userPatterns.completionRates[hour].completed++;
        }

        // Update common tasks
        if (!this.userPatterns.commonTasks[text]) {
            this.userPatterns.commonTasks[text] = 0;
        }
        this.userPatterns.commonTasks[text]++;

        // Categorize task (simple keyword-based categorization)
        const category = this.categorizeTask(text);
        if (!this.userPatterns.taskCategories[category]) {
            this.userPatterns.taskCategories[category] = [];
        }
        this.userPatterns.taskCategories[category].push({
            text,
            hour,
            timestamp: Date.now()
        });

        // Update daily stats
        this.updateDailyStats(completed);

        // Save patterns to localStorage
        this.savePatterns();
    }

    // Categorize task based on keywords
    categorizeTask(text) {
        const keywords = {
            work: ['meeting', 'project', 'email', 'call', 'report', 'presentation'],
            health: ['exercise', 'gym', 'workout', 'run', 'yoga', 'meditation'],
            personal: ['read', 'study', 'learn', 'practice'],
            social: ['lunch', 'dinner', 'meet', 'friend', 'family'],
            routine: ['breakfast', 'lunch', 'dinner', 'sleep', 'wake']
        };

        text = text.toLowerCase();
        for (const [category, words] of Object.entries(keywords)) {
            if (words.some(word => text.includes(word))) {
                return category;
            }
        }
        return 'other';
    }

    // Update daily statistics
    updateDailyStats(completed) {
        this.dailyStats.tasksAdded++;
        if (completed) {
            this.dailyStats.tasksCompleted++;
        }
    }

    // Generate task suggestions based on patterns
    generateSuggestions(hour) {
        const suggestions = [];
        const hourPatterns = this.userPatterns.tasksByHour[hour] || [];
        const commonTasks = this.getCommonTasksForHour(hour);
        const categoryTrends = this.getCategoryTrendsForHour(hour);

        // Add suggestions based on common tasks
        commonTasks.forEach(task => {
            suggestions.push({
                text: task,
                confidence: 'high',
                reason: 'You often do this task at this time'
            });
        });

        // Add suggestions based on category trends
        categoryTrends.forEach(category => {
            const tasks = this.userPatterns.taskCategories[category];
            if (tasks && tasks.length > 0) {
                const recentTask = tasks[tasks.length - 1];
                suggestions.push({
                    text: recentTask.text,
                    confidence: 'medium',
                    reason: `This fits your ${category} routine`
                });
            }
        });

        return suggestions.slice(0, 3); // Return top 3 suggestions
    }

    // Get common tasks for a specific hour
    getCommonTasksForHour(hour) {
        const hourTasks = this.userPatterns.tasksByHour[hour] || [];
        const taskCounts = {};
        
        hourTasks.forEach(task => {
            if (!taskCounts[task.text]) {
                taskCounts[task.text] = 0;
            }
            taskCounts[task.text]++;
        });

        return Object.entries(taskCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([task]) => task);
    }

    // Get category trends for a specific hour
    getCategoryTrendsForHour(hour) {
        const categoryCounts = {};
        
        Object.entries(this.userPatterns.taskCategories).forEach(([category, tasks]) => {
            const tasksAtHour = tasks.filter(task => task.hour === hour);
            if (tasksAtHour.length > 0) {
                categoryCounts[category] = tasksAtHour.length;
            }
        });

        return Object.entries(categoryCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 2)
            .map(([category]) => category);
    }

    // Perform evening reflection and pattern analysis
    async eveningReflection() {
        const completionRate = this.dailyStats.tasksCompleted / this.dailyStats.tasksAdded;
        const productiveHours = Array.from(this.dailyStats.productiveHours);

        // Generate insights
        const insights = {
            completionRate,
            productiveHours,
            suggestions: this.generateDailyInsights()
        };

        // Reset daily stats
        this.dailyStats = {
            tasksAdded: 0,
            tasksCompleted: 0,
            productiveHours: new Set()
        };

        return insights;
    }

    // Generate insights based on daily patterns
    generateDailyInsights() {
        const insights = [];
        
        // Analyze completion rates by hour
        Object.entries(this.userPatterns.completionRates).forEach(([hour, stats]) => {
            const rate = stats.completed / stats.total;
            if (rate < 0.5) {
                insights.push(`Tasks at ${hour} have a low completion rate. Consider scheduling fewer tasks or different types of tasks during this time.`);
            }
        });

        // Analyze category distribution
        const categoryDistribution = {};
        Object.entries(this.userPatterns.taskCategories).forEach(([category, tasks]) => {
            categoryDistribution[category] = tasks.length;
        });

        // Check for category balance
        const totalTasks = Object.values(categoryDistribution).reduce((a, b) => a + b, 0);
        Object.entries(categoryDistribution).forEach(([category, count]) => {
            const percentage = (count / totalTasks) * 100;
            if (percentage > 40) {
                insights.push(`Your schedule is heavily focused on ${category} tasks. Consider adding more variety for better balance.`);
            }
        });

        return insights;
    }

    // Save patterns to localStorage
    savePatterns() {
        localStorage.setItem('userPatterns', JSON.stringify(this.userPatterns));
    }
}

// Initialize AI Manager
const aiManager = new AIManager();

// Export for use in other files
window.aiManager = aiManager; 