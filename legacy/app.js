// ==================== //
// DOM Elements
// ==================== //
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const metaThemeColor = document.getElementById('meta-theme-color');
const streakCountEl = document.getElementById('streak-count');
const historyCardsContainer = document.getElementById('history-cards');
const habitsListContainer = document.getElementById('habits-list');
const newHabitInput = document.getElementById('new-habit-input');
const addHabitBtn = document.getElementById('add-habit-btn');
const currentDayEl = document.getElementById('current-day');
const currentDateEl = document.getElementById('current-date');
const dailyQuoteText = document.getElementById('daily-quote-text');

// Chatbot Elements
const chatFab = document.getElementById('chat-fab');
const chatbotWindow = document.getElementById('chatbot-window');
const closeChatBtn = document.getElementById('close-chat-btn');
const sendChatBtn = document.getElementById('send-chat-btn');
const chatInput = document.getElementById('chat-input');
const chatbotMessages = document.getElementById('chatbot-messages');

// ==================== //
// CONFIGURATION
// ==================== //
const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE';
const todayStr = getLocalDateString(new Date());

const QUOTES = [
    "The secret of getting ahead is getting started.",
    "It's not about perfect. It's about effort.",
    "Small disciplines repeated with consistency every day lead to great achievements.",
    "Motivation is what gets you started. Habit is what keeps you going.",
    "You do not rise to the level of your goals. You fall to the level of your systems.",
    "Don't stop when you're tired. Stop when you're done.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "Good habits are as addictive as bad habits, and a lot more rewarding.",
    "Your life does not get better by chance, it gets better by change.",
    "Discipline is choosing between what you want now and what you want most.",
    "A year from now you may wish you had started today.",
    "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    "Focus on being productive instead of busy.",
    "Make each day your masterpiece.",
    "The only bad workout is the one that didn't happen.",
    "Doubt kills more dreams than failure ever will.",
    "Do something today that your future self will thank you for.",
    "Great things never come from comfort zones.",
    "It always seems impossible until it's done.",
    "Don't wait for opportunity. Create it.",
    "Dream big. Start small. Act now.",
    "Habits form character, and character shapes destiny.",
    "Consistency is what transforms average into excellence.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Success doesn't just find you. You have to go out and get it.",
    "Stop making excuses. Start making progress.",
    "Push yourself, because no one else is going to do it for you.",
    "Sometimes later becomes never. Do it now.",
    "Wake up with determination. Go to bed with satisfaction.",
    "The key to success is to focus on goals, not obstacles."
];

// ==================== //
// STATE
// ==================== //
let appState = {
    streak: 0,
    theme: 'dark',
    habits: ['College', 'Study', 'Workout', 'Extra Work'], // Dynamic array of habit names
    history: {} // Format: { "YYYY-MM-DD": { "College": true, "Study": false... } }
};

// ==================== //
// INITIALIZATION
// ==================== //
function initApp() {
    loadState();
    setupDateDisplay();
    setupDailyQuote();
    setupTheme();
    renderHabits();
    renderStreak();
    renderHistory();
    attachEventListeners();
}

// ==================== //
// HELPERS
// ==================== //
function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateStr(dateStr) {
    const parts = dateStr.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    return { dayName, dayNum };
}

function areAllHabitsDone(dayData) {
    if (!dayData || appState.habits.length === 0) return false;
    // Check if EVERY habit currently tracked is true
    for (const habit of appState.habits) {
        if (!dayData[habit]) return false;
    }
    return true;
}

function isAnyHabitDone(dayData) {
    if (!dayData) return false;
    for (const habit of appState.habits) {
        if (dayData[habit]) return true;
    }
    return false;
}

function getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

// ==================== //
// STATE MANAGEMENT
// ==================== //
function loadState() {
    const savedState = localStorage.getItem('kirushu_state_v3');
    if (savedState) {
        appState = JSON.parse(savedState);
    } else {
        // Try migrating from v2
        const oldState = localStorage.getItem('kirushu_state_v2');
        if (oldState) {
            const parsed = JSON.parse(oldState);
            appState.theme = parsed.theme || 'dark';
            appState.streak = parsed.streak || 0;
            // Migrate history to capital letters for consistency with dynamic names
            for (const date in parsed.history) {
                appState.history[date] = {
                    'College': parsed.history[date].college || false,
                    'Study': parsed.history[date].study || false,
                    'Workout': parsed.history[date].workout || false,
                    'Extra Work': parsed.history[date].extra || false
                };
            }
        }
    }

    // Default habits if somehow empty
    if (!appState.habits || appState.habits.length === 0) {
        appState.habits = ['College', 'Study', 'Workout', 'Extra Work'];
    }

    // Initialize today's structure
    if (!appState.history[todayStr]) {
        validateStreak();
        appState.history[todayStr] = {};
        appState.habits.forEach(h => appState.history[todayStr][h] = false);
    } else {
        // Ensure today's object has keys for any newly added habits
        appState.habits.forEach(h => {
            if (appState.history[todayStr][h] === undefined) {
                appState.history[todayStr][h] = false;
            }
        });
    }
    saveState();
}

function saveState() {
    localStorage.setItem('kirushu_state_v3', JSON.stringify(appState));
}

function validateStreak() {
    let currentStreak = 0;
    const todayAsDate = new Date();
    
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(todayAsDate);
        checkDate.setDate(checkDate.getDate() - i);
        const checkDateStr = getLocalDateString(checkDate);
        
        let dayData = appState.history[checkDateStr];
        let allDone = areAllHabitsDone(dayData);

        if (i === 0) {
            if (allDone) currentStreak++;
        } else {
            if (allDone) currentStreak++;
            else break;
        }
    }

    if (currentStreak > appState.streak && areAllHabitsDone(appState.history[todayStr])) {
        triggerConfetti();
    }
    appState.streak = currentStreak;
}

// ==================== //
// UI RENDERING
// ==================== //
function setupDateDisplay() {
    const today = new Date();
    currentDayEl.textContent = today.toLocaleDateString('en-US', { weekday: 'long' });
    currentDateEl.textContent = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function setupDailyQuote() {
    // Predictable index based on day of year
    const index = getDayOfYear() % QUOTES.length;
    dailyQuoteText.textContent = `"${QUOTES[index]}"`;
}

function renderHabits() {
    habitsListContainer.innerHTML = '';
    const todayData = appState.history[todayStr];

    appState.habits.forEach((habit, index) => {
        const isChecked = todayData[habit] || false;
        
        const label = document.createElement('label');
        label.className = 'habit-item';
        
        // Input
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'habit-checkbox';
        input.checked = isChecked;
        input.onchange = (e) => handleHabitChange(habit, e.target.checked);
        
        const customCheck = document.createElement('div');
        customCheck.className = 'checkbox-custom';
        
        const info = document.createElement('div');
        info.className = 'habit-info';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'habit-name';
        nameSpan.textContent = habit;
        
        info.appendChild(nameSpan);

        // Delete Button
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-habit-btn';
        delBtn.innerHTML = '×';
        delBtn.onclick = (e) => {
            e.preventDefault(); // prevent triggering the checkbox toggle
            removeHabit(habit);
        };

        label.appendChild(input);
        label.appendChild(customCheck);
        label.appendChild(info);
        label.appendChild(delBtn);
        
        habitsListContainer.appendChild(label);
    });
}

function renderStreak() {
    validateStreak();
    streakCountEl.textContent = `${appState.streak} Day${appState.streak !== 1 ? 's' : ''}`;
    saveState();
}

function renderHistory() {
    historyCardsContainer.innerHTML = '';
    const todayDate = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(todayDate);
        d.setDate(d.getDate() - i);
        const dStr = getLocalDateString(d);
        const { dayName, dayNum } = formatDateStr(dStr);
        
        const dayData = appState.history[dStr];
        let statusClass = ''; 
        
        if (dayData) {
            if (areAllHabitsDone(dayData)) {
                statusClass = 'perfect';
            } else if (isAnyHabitDone(dayData) || dStr !== todayStr) {
                if (dStr !== todayStr) statusClass = 'missed';
            }
        } else if (dStr !== todayStr) {
            statusClass = 'missed';
        }
        
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <span class="h-day">${dayName}</span>
            <span class="h-date">${dayNum}</span>
            <div class="h-status ${statusClass}"></div>
        `;
        historyCardsContainer.appendChild(card);
    }
    historyCardsContainer.scrollLeft = historyCardsContainer.scrollWidth;
}

// ==================== //
// HABIT LOGIC
// ==================== //
function handleHabitChange(habit, isChecked) {
    appState.history[todayStr][habit] = isChecked;
    renderStreak();
    renderHistory();
    saveState();
}

function addNewHabit() {
    const val = newHabitInput.value.trim();
    if (val && !appState.habits.includes(val)) {
        appState.habits.push(val);
        appState.history[todayStr][val] = false;
        newHabitInput.value = '';
        renderHabits();
        renderStreak();
        renderHistory();
        saveState();
    }
}

function removeHabit(habit) {
    if (confirm(`Are you sure you want to delete '${habit}'? This impacts the calculation of your past streaks.`)) {
        appState.habits = appState.habits.filter(h => h !== habit);
        // We do NOT delete it from history so past streak data isn't corrupted, 
        // but areAllHabitsDone only checks current appState.habits anyway!
        renderHabits();
        renderStreak();
        renderHistory();
        saveState();
    }
}

// ==================== //
// AI CHATBOT LOGIC (Groq)
// ==================== //
chatFab.addEventListener('click', () => chatbotWindow.classList.add('active'));
closeChatBtn.addEventListener('click', () => chatbotWindow.classList.remove('active'));

async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    // Append User Message
    appendMessage(text, 'chat-user');
    chatInput.value = '';
    
    // System Context
    const systemPrompt = `You are Kirushu, a highly motivational AI habit coach inside a habit tracker app. The user just logged in. 
    Be short, punchy, and highly motivational. The user's current habits to track are: ${appState.habits.join(', ')}. 
    Current streak is ${appState.streak} days. Help them reflect on their day, or motivate them to check off their habits!`;

    // Show typing...
    const typingId = 'msg-' + Date.now();
    appendMessage("...", 'chat-bot', typingId);

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ],
                max_tokens: 150
            })
        });

        const data = await response.json();
        const reply = data.choices[0].message.content;
        
        // Remove typing and add real message
        document.getElementById(typingId).remove();
        appendMessage(reply, 'chat-bot');

    } catch (e) {
        document.getElementById(typingId).remove();
        appendMessage("Network error. Could not reach Groq servers. Ensure you are online.", 'chat-bot');
    }
}

function appendMessage(text, className, id = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = className;
    msgDiv.textContent = text;
    if (id) msgDiv.id = id;
    chatbotMessages.appendChild(msgDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

sendChatBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// ==================== //
// EVENT LISTENERS
// ==================== //
function attachEventListeners() {
    themeToggleBtn.addEventListener('click', () => {
        appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
        saveState();
    });

    addHabitBtn.addEventListener('click', addNewHabit);
    newHabitInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewHabit();
    });
}

function setupTheme() { applyTheme(); }

function applyTheme() {
    document.documentElement.setAttribute('data-theme', appState.theme);
    if (appState.theme === 'dark') {
        metaThemeColor.setAttribute('content', '#0f1115');
        themeIcon.innerHTML = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>`;
    } else {
        metaThemeColor.setAttribute('content', '#f5f7fa');
        themeIcon.innerHTML = `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`;
    }
}

// ==================== //
// CONFETTI
// ==================== //
function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#8b5cf6', '#10b981', '#ff512f', '#f59e0b', '#3b82f6'];

    for (let i = 0; i < 100; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            r: Math.random() * 6 + 2,
            dx: Math.random() * 10 - 5,
            dy: Math.random() * -10 - 2,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, index) => {
            p.x += p.dx;
            p.y += p.dy;
            p.dy += 0.2; 
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            if (p.y > canvas.height) particles.splice(index, 1);
        });
        if (particles.length === 0) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    animate();
}

// Boot up
document.addEventListener('DOMContentLoaded', initApp);
