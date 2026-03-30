"use client";

import { useState, useEffect, useRef } from 'react';

// ==================== //
// CONFIGURATION
// ==================== //
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

// Helpers
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

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function areAllHabitsDone(dayData, currentHabits) {
  if (!dayData || currentHabits.length === 0) return false;
  for (const habit of currentHabits) {
      if (!dayData[habit]) return false;
  }
  return true;
}

function isAnyHabitDone(dayData, currentHabits) {
  if (!dayData) return false;
  for (const habit of currentHabits) {
      if (dayData[habit]) return true;
  }
  return false;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [streak, setStreak] = useState(0);
  const [habits, setHabits] = useState(['College', 'Study', 'Workout', 'Extra Work']);
  const [history, setHistory] = useState({});
  const [newHabit, setNewHabit] = useState('');
  
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: "Hello! I'm your AI habit coach. Log your daily activity or ask for advice!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const canvasRef = useRef(null);
  const messagesEndRef = useRef(null);
  const todayStr = getLocalDateString(new Date());

  // Initialization
  useEffect(() => {
    // Load state
    const savedState = localStorage.getItem('kirushu_state_next');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setTheme(parsed.theme || 'dark');
        setHabits(parsed.habits || ['College', 'Study', 'Workout', 'Extra Work']);
        
        let hist = parsed.history || {};
        // Initialize today structure
        if (!hist[todayStr]) hist[todayStr] = {};
        
        setHistory(hist);
      } catch (e) { console.error("Could not parse history", e); }
    } else {
      // Migrate from v3 or setup defaults
      const oldV3 = localStorage.getItem('kirushu_state_v3');
      if (oldV3) {
        const parsedV3 = JSON.parse(oldV3);
        setTheme(parsedV3.theme || 'dark');
        setHabits(parsedV3.habits || ['College', 'Study', 'Workout', 'Extra Work']);
        setHistory(parsedV3.history || { [todayStr]: {} });
      } else {
        setHistory({ [todayStr]: {} });
      }
    }
    setMounted(true);
  }, []);

  // Sync state to localstorage & effectuate theme/streak
  useEffect(() => {
    if (!mounted) return;
    
    // Ensure today structure has keys
    let updatedHistory = { ...history };
    let changed = false;
    
    if (!updatedHistory[todayStr]) {
      updatedHistory[todayStr] = {};
      changed = true;
    }
    
    habits.forEach(h => {
      if (updatedHistory[todayStr][h] === undefined) {
        updatedHistory[todayStr][h] = false;
        changed = true;
      }
    });

    if (changed) {
      setHistory(updatedHistory);
      return; // prevent saving yet
    }

    // Recalculate streak
    let currentStreak = 0;
    const todayAsDate = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(todayAsDate);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = getLocalDateString(checkDate);
      
      let dayData = updatedHistory[checkDateStr];
      let allDone = areAllHabitsDone(dayData, habits);

      if (i === 0) {
          if (allDone) currentStreak++;
      } else {
          if (allDone) currentStreak++;
          else break;
      }
    }
    
    if (currentStreak > streak && areAllHabitsDone(updatedHistory[todayStr], habits)) {
      triggerConfetti();
    }
    setStreak(currentStreak);

    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);
    document.head.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f1115' : '#f5f7fa');
    
    localStorage.setItem('kirushu_state_next', JSON.stringify({ theme, streak: currentStreak, habits, history: updatedHistory }));
  }, [theme, habits, history, mounted]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping, chatOpen]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleHabitToggle = (habitName, isChecked) => {
    setHistory(prev => ({
      ...prev,
      [todayStr]: {
        ...(prev[todayStr] || {}),
        [habitName]: isChecked
      }
    }));
  };

  const addHabit = () => {
    const val = newHabit.trim();
    if (val && !habits.includes(val)) {
      setHabits(prev => [...prev, val]);
      setHistory(prev => ({
        ...prev,
        [todayStr]: {
          ...(prev[todayStr] || {}),
          [val]: false
        }
      }));
      setNewHabit('');
    }
  };

  const deleteHabit = (habitName) => {
    if (confirm(`Are you sure you want to delete '${habitName}'?`)) {
      setHabits(prev => prev.filter(h => h !== habitName));
    }
  };

  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
  };

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;

    const newMsgs = [...chatMessages, { role: 'user', text }];
    setChatMessages(newMsgs);
    setChatInput('');
    setIsTyping(true);

    const systemPrompt = `You are Kirushu, a highly motivational AI habit coach inside a habit tracker app. The user just logged in. 
    Be short, punchy, and highly motivational. The user's current habits to track are: ${habits.join(', ')}. 
    Current streak is ${streak} days. Help them reflect on their day, or motivate them to check off their habits!`;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, text })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');

      setChatMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'bot', text: `Error: ${e.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!mounted) return null; // Avoid hydration mismatch

  // Today Date details
  const today = new Date();
  const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const currentDateFull = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const quoteText = `"${QUOTES[getDayOfYear() % QUOTES.length]}"`;

  // History Cards Array
  const historyCards = [];
  for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = getLocalDateString(d);
      const { dayName, dayNum } = formatDateStr(dStr);
      
      const dayData = history[dStr];
      let statusClass = ''; 
      
      if (dayData) {
          if (areAllHabitsDone(dayData, habits)) {
              statusClass = 'perfect';
          } else if (isAnyHabitDone(dayData, habits) || dStr !== todayStr) {
              if (dStr !== todayStr) statusClass = 'missed';
          }
      } else if (dStr !== todayStr) {
          statusClass = 'missed';
      }
      historyCards.push({ dStr, dayName, dayNum, statusClass });
  }

  return (
    <>
      <div className="app-container">
        <header className="header">
          <div>
            <h1 className="logo">Kirushu</h1>
            <p className="subtitle">Daily Habit Tracker</p>
          </div>
          <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle theme">
             {theme === 'dark' ? (
                <svg id="theme-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                </svg>
             ) : (
                <svg id="theme-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
                </svg>
             )}
          </button>
        </header>

        <main>
          <div className="quote-card">
            <p>{quoteText}</p>
          </div>

          <div className="date-display">
            <span className="current-day">{currentDayName}</span>
            <span className="current-date">{currentDateFull}</span>
          </div>

          <section className="streak-card">
            <div className="streak-content">
              <div className="streak-icon">🔥</div>
              <div className="streak-text">
                <h2>{streak} Day{streak !== 1 && 's'}</h2>
                <p>Current Streak</p>
              </div>
            </div>
          </section>

          <section className="habits-section">
            <h3>Daily Goals</h3>
            <div className="habits-list">
              {habits.map((habit) => {
                const isChecked = history[todayStr]?.[habit] || false;
                return (
                  <label key={habit} className="habit-item">
                    <input 
                      type="checkbox" 
                      className="habit-checkbox" 
                      checked={isChecked}
                      onChange={(e) => handleHabitToggle(habit, e.target.checked)}
                    />
                    <div className="checkbox-custom"></div>
                    <div className="habit-info">
                      <span className="habit-name">{habit}</span>
                    </div>
                    <button className="delete-habit-btn" onClick={(e) => { e.preventDefault(); deleteHabit(habit); }}>
                      ×
                    </button>
                  </label>
                );
              })}
            </div>
            
            <div className="add-habit-form">
              <input 
                type="text" 
                id="new-habit-input" 
                placeholder="Enter new habit..." 
                autoComplete="off"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addHabit()}
              />
              <button id="add-habit-btn" onClick={addHabit}>+</button>
            </div>
          </section>

          <section className="calendar-section">
            <h3>History (Last 7 Days)</h3>
            <div className="history-cards" id="history-cards">
              {historyCards.map((card, i) => (
                <div key={card.dStr} className="history-card" ref={el => {
                  if (el && i === historyCards.length - 1) { el.parentElement.scrollLeft = el.parentElement.scrollWidth; }
                }}>
                  <span className="h-day">{card.dayName}</span>
                  <span className="h-date">{card.dayNum}</span>
                  <div className={`h-status ${card.statusClass}`}></div>
                </div>
              ))}
            </div>
          </section>
        </main>
        
        <footer>
          <p>Built for the win. Keep the streak alive.</p>
        </footer>
      </div>

      <div className={`chatbot-window ${chatOpen ? 'active' : ''}`}>
        <div className="chatbot-header">
          <h3>Kirushu AI Assistant</h3>
          <button id="close-chat-btn" aria-label="Close Chat" onClick={() => setChatOpen(false)}>×</button>
        </div>
        <div className="chatbot-messages">
          {chatMessages.map((msg, i) => (
            <div key={i} className={msg.role === 'bot' ? 'chat-bot' : 'chat-user'}>
              {msg.text}
            </div>
          ))}
          {isTyping && <div className="chat-bot">...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="chatbot-input">
          <input 
            type="text" 
            id="chat-input" 
            placeholder="Type your message..." 
            autoComplete="off"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
          />
          <button id="send-chat-btn" onClick={sendChatMessage}>→</button>
        </div>
      </div>
      
      <button className="chat-fab" onClick={() => setChatOpen(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
        </svg>
      </button>

      <canvas id="confetti-canvas" ref={canvasRef}></canvas>
    </>
  );
}
