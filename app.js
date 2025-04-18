// -------------------- Constants and Initial Setup --------------------
const planner = document.getElementById('planner');
const streakCount = document.getElementById('streakCount');
const themeToggle = document.getElementById('themeToggle');
const installBtn = document.getElementById('installBtn');
const resetStreakBtn = document.getElementById('resetStreakBtn');
const root = document.body;
const loadingOverlay = document.querySelector('.loading-overlay');
const tutorialOverlay = document.querySelector('.tutorial-overlay');

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
let streak = parseInt(localStorage.getItem('streak')) || 0;
let lastCompletedDate = localStorage.getItem('lastCompletedDate') || null;

// Initialize streak count
streakCount.innerText = streak;

// Achievement milestones and quotes
const achievements = {
    3: {
        medal: "🥉",
        title: "Bronze Achiever!",
        quote: "Great start! You're building momentum. Keep going!"
    },
    5: {
        medal: "🥈",
        title: "Silver Star!",
        quote: "Consistency is key! You're showing real dedication."
    },
    10: {
        medal: "🥇",
        title: "Gold Master!",
        quote: "Incredible! You've mastered the art of consistency."
    },
    20: {
        medal: "🏆",
        title: "Platinum Pro!",
        quote: "You're unstoppable! Your dedication is inspiring."
    },
    30: {
        medal: "👑",
        title: "Diamond Legend!",
        quote: "You've achieved legendary status! Keep shining!"
    }
};

// Track achieved milestones
let achievedMilestones = new Set(JSON.parse(localStorage.getItem('achievedMilestones') || '[]'));

// Tutorial steps configuration
const tutorialSteps = [
    {
        title: "Welcome to Task Glow! 👋",
        content: "Let's get you started with organizing your day effectively. This quick tutorial will show you the main features.",
        highlight: null
    },
    {
        title: "Adding Tasks ✏️",
        content: "Click on any time block and type your task. Press Enter or tap the checkmark to add it to your list.",
        highlight: ".hour-block"
    },
    {
        title: "Track Your Progress 🎯",
        content: "Mark tasks as complete by clicking the checkmark. Build streaks by completing tasks consistently!",
        highlight: "#streak"
    },
    {
        title: "AI Assistance 🤖",
        content: "Our AI will learn from your patterns and suggest tasks at the right times. It adapts to your style!",
        highlight: ".ai-panel"
    },
    {
        title: "Achievements 🏆",
        content: "Earn achievements as you maintain your streak. Click the target icon to view your progress!",
        highlight: ".milestone-info"
    }
];

let currentTutorialStep = 0;

// Loading state management
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.opacity = '0';
    setTimeout(() => {
        loadingOverlay.style.display = 'none';
        loadingOverlay.style.opacity = '1';
        
        // Show tutorial for first-time users
        if (!localStorage.getItem('tutorialComplete')) {
            showTutorial();
        }
    }, 300);
}

// Tutorial management
function showTutorial() {
    tutorialOverlay.style.display = 'block';
    updateTutorialStep();
}

function updateTutorialStep() {
    const step = tutorialSteps[currentTutorialStep];
    const tutorialStep = document.querySelector('.tutorial-step');
    
    // Update content
    tutorialStep.innerHTML = `
        <h3>${step.title}</h3>
        <p>${step.content}</p>
        <div class="tutorial-buttons">
            <button class="tutorial-btn tutorial-skip">Skip Tutorial</button>
            <button class="tutorial-btn tutorial-next">${currentTutorialStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}</button>
        </div>
    `;

    // Remove previous highlight
    const previousHighlight = document.querySelector('.highlight-element');
    if (previousHighlight) {
        previousHighlight.classList.remove('highlight-element');
    }

    // Add new highlight
    if (step.highlight) {
        const elementToHighlight = document.querySelector(step.highlight);
        if (elementToHighlight) {
            elementToHighlight.classList.add('highlight-element');
            
            // Position tutorial step near highlighted element
            const rect = elementToHighlight.getBoundingClientRect();
            tutorialStep.style.top = `${rect.bottom + 10}px`;
            tutorialStep.style.left = `${rect.left}px`;
        }
    } else {
        // Center the tutorial step if no highlight
        tutorialStep.style.top = '50%';
        tutorialStep.style.left = '50%';
        tutorialStep.style.transform = 'translate(-50%, -50%)';
    }
}

function nextTutorialStep() {
    currentTutorialStep++;
    if (currentTutorialStep >= tutorialSteps.length) {
        completeTutorial();
    } else {
        updateTutorialStep();
    }
}

function completeTutorial() {
    tutorialOverlay.style.display = 'none';
    localStorage.setItem('tutorialComplete', 'true');
    const previousHighlight = document.querySelector('.highlight-element');
    if (previousHighlight) {
        previousHighlight.classList.remove('highlight-element');
    }
}

// Tutorial event listeners
tutorialOverlay.addEventListener('click', (e) => {
    if (e.target.classList.contains('tutorial-next')) {
        nextTutorialStep();
    } else if (e.target.classList.contains('tutorial-skip')) {
        completeTutorial();
    }
});

// Show loading state on initial load
showLoading();

// Initialize app with loading state
async function initializeApp() {
    try {
        await Promise.all([
            // Simulate loading time for demonstration
            new Promise(resolve => setTimeout(resolve, 1000)),
            // Add your actual initialization promises here
        ]);

        createHourBlocks();

        // Load saved streak first
        streak = parseInt(localStorage.getItem('streak')) || 0;
        lastCompletedDate = localStorage.getItem('lastCompletedDate');
        streakCount.innerText = streak;

        // Ensure tasks persist across reloads
        const today = new Date().toDateString();
        const lastAccessDate = localStorage.getItem('lastAccessDate');

        if (!lastAccessDate || new Date(lastAccessDate).toDateString() !== today) {
            localStorage.setItem('lastAccessDate', today);
        }

        loadTasks();

        initializeTheme();
        updateMilestoneIcon(streak); // Update milestone icon based on streak

        // Hide loading overlay after initialization
        hideLoading();
    } catch (error) {
        console.error('Error initializing app:', error);
        hideLoading();
    }
}

// Start app initialization
initializeApp();

// -------------------- Theme Toggle Logic --------------------
const themeCheckbox = document.querySelector('.checkbox');

function applyTheme(theme) {
  if (theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
    themeCheckbox.checked = true;
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
    themeCheckbox.checked = false;
  }
  localStorage.setItem('theme', theme);
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);
}

themeCheckbox.addEventListener('change', () => {
  const newTheme = themeCheckbox.checked ? 'light' : 'dark';
  applyTheme(newTheme);
});

initializeTheme();

// -------------------- Planner Initialization --------------------
function createHourBlocks() {
  planner.innerHTML = '';  
  hours.forEach(hour => {
    const block = document.createElement('div');
    block.classList.add('hour-block');
    block.dataset.hour = hour;
    block.innerHTML = `
      <h3>${hour}</h3>
      <input type="text" class="task-input" placeholder="Add a task..." />
      <ul class="task-list"></ul>
    `;
    planner.appendChild(block);
  });
}

// -------------------- Task Management --------------------
function createTaskElement(text, done = false) {
  const li = document.createElement('li');
  li.classList.add('task-item');
  if (done) li.classList.add('done');

  li.innerHTML = `
    <span class="task-text">${text}</span>
    <div class="task-actions">
      <button class="task-done-btn">✓</button>
      <button class="task-remove-btn">✗</button>
    </div>
  `;

  return li;
}

const streakQuotes = {
    1: "Every journey begins with a single step! 🌱",
    2: "Two days strong! You're building momentum! 💫",
    3: "Three's a charm! Keep that energy flowing! ⚡",
    4: "Four days in! You're creating a pattern of success! 🎯",
    5: "High five! You're halfway to bronze! 🖐",
    6: "Six days strong! Bronze is within reach! ✨",
    7: "Welcome to the Bronze club! 🥉",
    10: "Double digits! Silver's on the horizon! 🌟",
    14: "Two weeks of dedication! Silver achieved! 🥈",
    20: "Twenty days! You're becoming unstoppable! 🚀",
    30: "A month of excellence! Gold is yours! 🥇",
    45: "Forty-five days! Platinum's getting closer! 💫",
    60: "Incredible! You've reached Platinum! 🏆",
    80: "Eighty days of dedication! Diamond in sight! ✨",
    100: "Legendary! You've achieved Diamond status! 💎"
};

function generateMilestoneProgress(streak) {
    const milestones = [
        { days: 7, icon: '🥉', title: 'Bronze' },
        { days: 14, icon: '🥈', title: 'Silver' },
        { days: 30, icon: '🥇', title: 'Gold' },
        { days: 60, icon: '🏆', title: 'Platinum' },
        { days: 100, icon: '💎', title: 'Diamond' }
    ];

    let currentMilestone = milestones.find(m => streak < m.days) || milestones[milestones.length - 1];
    let previousMilestone = milestones[milestones.indexOf(currentMilestone) - 1];
    let startDays = previousMilestone ? previousMilestone.days : 0;
    let totalDays = currentMilestone.days - startDays;
    let progress = ((streak - startDays) / totalDays) * 100;

    // Generate checkpoints
    let checkpoints = [];
    let checkpointCount = 5; // Number of checkpoints between milestones
    let daysPerCheckpoint = totalDays / (checkpointCount + 1);
    
    for (let i = 1; i <= checkpointCount; i++) {
        checkpoints.push(Math.round(startDays + (daysPerCheckpoint * i)));
    }

    const timelineHTML = `
        <div class="milestone-point start">
            <div class="milestone-icon ${streak >= startDays ? 'achieved' : ''}">${startDays === 0 ? '🎯' : previousMilestone.icon}</div>
            <div class="milestone-title">${startDays === 0 ? 'Start' : previousMilestone.title}</div>
            <div class="milestone-days">${startDays} days</div>
        </div>
        ${checkpoints.map(day => `
            <div class="milestone-checkpoint ${streak >= day ? 'achieved' : ''}">
                <div class="checkpoint-dot"></div>
                <div class="checkpoint-label">${day} days</div>
            </div>
        `).join('')}
        <div class="milestone-point target">
            <div class="milestone-icon ${streak >= currentMilestone.days ? 'achieved' : ''}">${currentMilestone.icon}</div>
            <div class="milestone-title">${currentMilestone.title}</div>
            <div class="milestone-days">${currentMilestone.days} days</div>
        </div>
    `;

    return `
        <div class="milestone-progress">
            <div class="milestone-timeline">
                <div class="milestone-line"></div>
                <div class="milestone-progress-bar" style="width: ${progress}%"></div>
                ${timelineHTML}
            </div>
            <div class="current-streak">
                <div class="streak-number">${streak}</div>
                <div class="streak-label">Current Streak</div>
                ${streakQuotes[streak] ? `<div class="streak-quote">${streakQuotes[streak]}</div>` : ''}
            </div>
        </div>
    `;
}

function addTask(hour, taskText) {
    const hourBlock = document.querySelector(`.hour-block[data-hour="${hour}"]`);
    if (!hourBlock) return;

    const taskList = hourBlock.querySelector('.task-list');
    const tasks = taskList.querySelectorAll('li');
    const input = hourBlock.querySelector('.task-input');
    
    // Limit tasks per hour to prevent overflow
    if (tasks.length >= 10) {
        alert("Don't be too ambitious! Max 10 tasks per hour.");
        return;
    }

    const li = createTaskElement(taskText);
    taskList.appendChild(li);
    saveTasks();
    
    // Clear input field
    input.value = '';
    
    // Update AI patterns
    window.aiManager.updateUserPatterns({ hour, text: taskText, completed: false });
}

function saveTasks() {
    const tasks = {};
    document.querySelectorAll('.hour-block').forEach(block => {
        const hour = block.dataset.hour;
        const taskItems = block.querySelectorAll('li');
        tasks[hour] = Array.from(taskItems).map(item => ({
            text: item.querySelector('.task-text').textContent,
            done: item.classList.contains('done')
        }));
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '{}');
    Object.entries(tasks).forEach(([hour, hourTasks]) => {
        const block = document.querySelector(`.hour-block[data-hour="${hour}"]`);
        if (!block) return;
        
        const taskList = block.querySelector('.task-list');
        hourTasks.forEach(task => {
            const li = createTaskElement(task.text, task.done);
            taskList.appendChild(li);
        });
    });
}

// -------------------- Event Listeners --------------------
planner.addEventListener('keypress', (e) => {
  if (e.target.classList.contains('task-input')) {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent new line
      const input = e.target;
      const value = input.value.trim();
      if (value) {
        const hour = input.closest('.hour-block').dataset.hour;
        addTask(hour, value);
        input.value = '';
        input.blur(); // Close mobile keyboard
        updateStreak();
      }
    }
  }
});

// Add blur event handler for mobile "done" button
planner.addEventListener('blur', (e) => {
  if (e.target.classList.contains('task-input')) {
    const input = e.target;
    const value = input.value.trim();
    if (value) {
      const hour = input.closest('.hour-block').dataset.hour;
      addTask(hour, value);
      input.value = '';
      updateStreak();
    }
  }
}, true);

planner.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;

  if (e.target.classList.contains('task-done-btn')) {
    li.classList.toggle('done');
    updateStreak();
    saveTasks();
    
    // Update AI patterns
    const hour = li.closest('.hour-block').dataset.hour;
    const text = li.querySelector('.task-text').textContent;
    window.aiManager.updateUserPatterns({ hour, text, completed: true });
  }

  if (e.target.classList.contains('task-remove-btn')) {
    li.remove();
    updateStreak();
    saveTasks();
  }

  // Handle AI suggestion actions
  if (e.target.classList.contains('confirm-suggestion')) {
    const suggestionDiv = e.target.closest('.ai-suggestion');
    const suggestion = suggestionDiv.querySelector('span').textContent;
    const hour = suggestionDiv.closest('.hour-block').dataset.hour;
    addTask(hour, suggestion);
    suggestionDiv.remove();
  }

  if (e.target.classList.contains('reject-suggestion')) {
    const suggestionDiv = e.target.closest('.ai-suggestion');
    suggestionDiv.remove();
  }
});

// -------------------- Streak Logic --------------------
function showAchievementPopup(milestone) {
    const achievement = achievements[milestone];
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
        <div class="achievement-medal">${achievement.medal}</div>
        <div class="achievement-title">${achievement.title}</div>
        <div class="achievement-quote">${achievement.quote}</div>
        <button class="achievement-close">Awesome!</button>
    `;

    document.body.appendChild(popup);

    // Add click handler to close button
    popup.querySelector('.achievement-close').addEventListener('click', () => {
        popup.remove();
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(popup)) {
            popup.remove();
        }
    }, 5000);
}

function checkAchievements(streak) {
    const previousAchievements = new Set(JSON.parse(localStorage.getItem('achievedMilestones') || '[]'));
    
    for (const milestone of [7, 14, 30, 60, 100]) {
        if (streak >= milestone && !previousAchievements.has(milestone)) {
            achievedMilestones.add(milestone);
            localStorage.setItem('achievedMilestones', JSON.stringify([...achievedMilestones]));
            showAchievementPopup(milestone);
            createConfetti();
            updateMilestoneIcon(streak);
        }
    }
}

function updateStreak() {
  const doneTasks = document.querySelectorAll('.task-list li.done');
  const today = new Date().toDateString();

  if (lastCompletedDate !== today && doneTasks.length > 5) {
    streak++;
    lastCompletedDate = today;
    localStorage.setItem('streak', streak);
    localStorage.setItem('lastCompletedDate', today);
    streakCount.innerText = streak;
        
        // Check for new achievements and update milestone modal
        checkAchievements(streak);
        updateMilestoneModal(streak);
    }
}

// Streak monitoring and notifications
function checkStreakStatus() {
    const today = new Date();
    const lastDate = new Date(lastCompletedDate);
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (daysDiff > 1 && streak > 0) {
        // Streak broken
        const resetMessage = {
            1: "Don't worry! Every new beginning comes from some other beginning's end.",
            2: "The comeback is always stronger than the setback. Start fresh!",
            3: "Every day is a new opportunity. Your next streak starts now!",
            4: "The only way to go is forward. Let's build a new streak!",
            5: "Success is not final, failure is not fatal. Time to begin again!",
            6: "The past is behind, let go of it. The future is ahead, let's build it!",
            7: "Every ending is a new beginning. Let's start fresh!",
            8: "The past is history, the future is unknown, but the present is a gift. That's why it's called the present.",
            9: "The only way to do great work is to love what you do. Start fresh!",
            10: "The best way to predict the future is to invent it. Start fresh!",
            11: "The future is unknown, but the present is a gift. That's why it's called the present.",
            12: "Sun will set to rise, so will your streak!",
        };

        const randomMessage = resetMessage[Math.floor(Math.random() * 12) + 1];
        showStreakResetNotification(randomMessage);
        resetStreak();
    } else if (daysDiff === 1 && streak > 0) {
        // One day missed - send reminder
        showStreakReminder();
    }
}

function showStreakResetNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'streak-reset-notification';
    notification.innerHTML = `
        <div class="streak-reset-content">
            <div class="streak-reset-icon">💔</div>
            <div class="streak-reset-title">Streak Reset</div>
            <div class="streak-reset-message">${message}</div>
            <div class="streak-reset-details">Previous streak: ${streak} days</div>
            <button class="streak-reset-close">I'll do better!</button>
        </div>
      `;

    document.body.appendChild(notification);

    // Add click handler to close button
    notification.querySelector('.streak-reset-close').addEventListener('click', () => {
        notification.remove();
    });

    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 8000);
}

function showStreakReminder() {
    if (Notification.permission === "granted") {
        new Notification("Don't Break Your Streak!", {
            body: "You're about to lose your streak! Complete some tasks today to keep it going!",
            icon: "icons/192 x 192.webp",
            badge: "icons/192 x 192.webp"
        });
    }
}

// Request notification permission on load
if ("Notification" in window) {
    Notification.requestPermission();
}

// Check streak status when the app loads
checkStreakStatus();

// Check streak status every hour
setInterval(checkStreakStatus, 60 * 60 * 1000);

// Update the reset streak function
function resetStreak() {
    streak = 0;
    localStorage.setItem('streak', streak);
    streakCount.innerText = streak;
    achievedMilestones.clear();
    localStorage.setItem('achievedMilestones', '[]');
}

resetStreakBtn.addEventListener('click', resetStreak);

// -------------------- PWA Installation --------------------
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt = null;
    installBtn.hidden = true;
  }
});

// -------------------- Initialize App --------------------
createHourBlocks();
loadTasks();

// Set up evening reflection
window.addEventListener('beforeunload', () => {
  window.aiManager.eveningReflection();
});

// Milestone Info Modal
const milestoneInfo = document.querySelector('.milestone-info');
const milestoneModal = document.createElement('div');
milestoneModal.className = 'milestone-modal';
milestoneModal.style.display = 'none';

const milestones = [
    {
        icon: '🥉',
        title: 'Bronze Achiever',
        description: 'Complete 7 days of consistent task planning'
    },
    {
        icon: '🥈',
        title: 'Silver Star',
        description: 'Maintain a 14-day streak of task completion'
    },
    {
        icon: '🥇',
        title: 'Gold Master',
        description: 'Achieve 30 days of perfect task planning and completion'
    },
    {
        icon: '🏆',
        title: 'Platinum Pro',
        description: 'Complete 60 days with 90% task completion rate'
    },
    {
        icon: '💎',
        title: 'Diamond Elite',
        description: 'Maintain 100 days of consistent planning and execution'
    }
];

milestoneModal.innerHTML = `
    <h2>Milestones & Achievements</h2>
    <div class="milestone-list">
        ${milestones.map(milestone => `
            <div class="milestone-item">
                <span class="milestone-icon">${milestone.icon}</span>
                <div class="milestone-details">
                    <div class="milestone-title">${milestone.title}</div>
                    <div class="milestone-description">${milestone.description}</div>
                </div>
            </div>
        `).join('')}
    </div>
    <button class="close-modal">X</button>
`;

document.body.appendChild(milestoneModal);

milestoneInfo.addEventListener('click', () => {
    const milestoneModal = document.querySelector('.milestone-modal');
    if (!milestoneModal) {
        // Create modal if it doesn't exist
        const modal = document.createElement('div');
        modal.className = 'milestone-modal';
        document.body.appendChild(modal);
        updateMilestoneModal(streak);
    } else {
        updateMilestoneModal(streak);
    }
    milestoneModal.style.display = 'block';
});

milestoneModal.querySelector('.close-modal').addEventListener('click', () => {
    milestoneModal.style.display = 'none';
});

// Update achievement level based on streak
function updateAchievementLevel(streak) {
    let achievement = '';
    if (streak >= 100) {
        achievement = 'diamond';
    } else if (streak >= 60) {
        achievement = 'platinum';
    } else if (streak >= 30) {
        achievement = 'gold';
    } else if (streak >= 14) {
        achievement = 'silver';
    } else if (streak >= 7) {
        achievement = 'bronze';
    }
    
    document.body.setAttribute('data-achievement', achievement);
}

// Update achievement level when streak changes
function updateStreakDisplay(streak) {
    const streakDisplay = document.querySelector('.streak-display');
    streakDisplay.textContent = `🔥 ${streak} day streak`;
    updateAchievementLevel(streak);
}

function updateMilestoneModal(streak) {
    const milestoneModal = document.querySelector('.milestone-modal');
    if (!milestoneModal) return;
    
    // Update modal content with progress roadmap
    const progressHTML = generateMilestoneProgress(streak);
    milestoneModal.innerHTML = `
        <button class="close-modal">X</button>
        <h2>Your Achievement Journey</h2>
        ${progressHTML}
    `;

    // Add event listener for close button
    const closeBtn = milestoneModal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            milestoneModal.style.display = 'none';
        });
    }
}

function updateMilestoneIcon(streak) {
    const milestoneInfo = document.querySelector('.milestone-info');
    let icon = '🎯'; // default icon

    if (streak >= 100) icon = '💎';
    else if (streak >= 60) icon = '🏆';
    else if (streak >= 30) icon = '🥇';
    else if (streak >= 14) icon = '🥈';
    else if (streak >= 7) icon = '🥉';

    milestoneInfo.textContent = icon;
}

function createConfetti() {
    const colors = ['#00ffd5', '#00ff88', '#ffff00', '#ff00ff', '#00ffff'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 3 + 's';
        
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
}

function showUpdateToast() {
    const toast = document.getElementById('update-toast');
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 5000);
  }
