// Mock data for habit tracker app
export const categories = [
  { id: 'health', name: 'Health', color: 'bg-green-100 text-green-800' },
  { id: 'productivity', name: 'Productivity', color: 'bg-blue-100 text-blue-800' },
  { id: 'learning', name: 'Learning', color: 'bg-purple-100 text-purple-800' },
  { id: 'fitness', name: 'Fitness', color: 'bg-orange-100 text-orange-800' },
  { id: 'mindfulness', name: 'Mindfulness', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'social', name: 'Social', color: 'bg-pink-100 text-pink-800' },
  { id: 'creative', name: 'Creative', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'personal', name: 'Personal', color: 'bg-gray-100 text-gray-800' }
];

export const badges = [
  { id: 'streak-3', name: 'Getting Started', description: '3 day streak', icon: '🌱', requirement: 3 },
  { id: 'streak-7', name: 'Week Warrior', description: '7 day streak', icon: '🔥', requirement: 7 },
  { id: 'streak-30', name: 'Month Master', description: '30 day streak', icon: '💪', requirement: 30 },
  { id: 'streak-100', name: 'Century Club', description: '100 day streak', icon: '💯', requirement: 100 },
  { id: 'consistent', name: 'Consistency King', description: '90% completion rate', icon: '👑', requirement: 90 },
  { id: 'early-bird', name: 'Early Bird', description: 'Complete before 9 AM', icon: '🐦', requirement: 'morning' }
];

// Generate mock completion history for the last 90 days
const generateCompletionHistory = () => {
  const history = {};
  const today = new Date();
  
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    // Random completion with bias towards more recent days
    history[dateString] = Math.random() > (i < 30 ? 0.2 : 0.4);
  }
  
  return history;
};

// Calculate streak from completion history
const calculateStreaks = (history) => {
  const dates = Object.keys(history).sort().reverse();
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  
  // Calculate current streak (from today backwards)
  for (let i = 0; i < dates.length; i++) {
    if (history[dates[i]]) {
      if (i === 0 || currentStreak > 0) {
        currentStreak++;
      }
      tempStreak++;
    } else {
      if (i === 0) break; // If today is not completed, no current streak
      tempStreak = 0;
    }
    bestStreak = Math.max(bestStreak, tempStreak);
  }
  
  return { current: currentStreak, best: bestStreak };
};

export const mockHabits = [
  {
    id: '1',
    name: 'Drink 8 glasses of water',
    category: 'health',
    color: 'bg-blue-50 border-blue-200',
    icon: '💧',
    createdAt: '2024-12-01',
    completionHistory: generateCompletionHistory(),
    totalDays: 45,
    description: 'Stay hydrated throughout the day'
  },
  {
    id: '2',
    name: 'Read for 30 minutes',
    category: 'learning',
    color: 'bg-purple-50 border-purple-200',
    icon: '📚',
    createdAt: '2024-11-15',
    completionHistory: generateCompletionHistory(),
    totalDays: 38,
    description: 'Daily reading habit for personal growth'
  },
  {
    id: '3',
    name: 'Exercise for 45 minutes',
    category: 'fitness',
    color: 'bg-orange-50 border-orange-200',
    icon: '🏃‍♂️',
    createdAt: '2024-12-10',
    completionHistory: generateCompletionHistory(),
    totalDays: 22,
    description: 'Daily workout routine'
  },
  {
    id: '4',
    name: 'Meditate for 10 minutes',
    category: 'mindfulness',
    color: 'bg-indigo-50 border-indigo-200',
    icon: '🧘‍♀️',
    createdAt: '2024-11-20',
    completionHistory: generateCompletionHistory(),
    totalDays: 33,
    description: 'Daily meditation practice'
  },
  {
    id: '5',
    name: 'Write in journal',
    category: 'personal',
    color: 'bg-pink-50 border-pink-200',
    icon: '📓',
    createdAt: '2024-12-05',
    completionHistory: generateCompletionHistory(),
    totalDays: 27,
    description: 'Reflect on the day and write thoughts'
  }
].map(habit => {
  const streaks = calculateStreaks(habit.completionHistory);
  return {
    ...habit,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
    earnedBadges: badges.filter(badge => 
      badge.requirement === streaks.best || 
      (badge.requirement === 'morning' && Math.random() > 0.7)
    )
  };
});

export const getTodayCompletion = () => {
  const today = new Date().toISOString().split('T')[0];
  const completedToday = mockHabits.filter(habit => habit.completionHistory[today]);
  return {
    completed: completedToday.length,
    total: mockHabits.length,
    percentage: Math.round((completedToday.length / mockHabits.length) * 100)
  };
};

export const getWeeklyProgress = () => {
  const today = new Date();
  const weekDays = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    weekDays.push(date.toISOString().split('T')[0]);
  }
  
  return weekDays.map(date => {
    const completed = mockHabits.filter(habit => habit.completionHistory[date]).length;
    return {
      date,
      completed,
      total: mockHabits.length,
      percentage: Math.round((completed / mockHabits.length) * 100)
    };
  });
};