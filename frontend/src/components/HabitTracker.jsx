import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Plus, Sun, Moon, Calendar, BarChart3, Target, Award } from 'lucide-react';
import { HabitCard } from './HabitCard';
import { CalendarView } from './CalendarView';
import { ProgressView } from './ProgressView';
import { HabitForm } from './HabitForm';
import { mockHabits, getTodayCompletion, badges } from '../mock/data';

export const HabitTracker = () => {
  const [habits, setHabits] = useState(mockHabits);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [activeTab, setActiveTab] = useState('habits');
  const [todayProgress, setTodayProgress] = useState(getTodayCompletion());

  useEffect(() => {
    // Apply theme
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleHabitToggle = (habitId) => {
    const today = new Date().toISOString().split('T')[0];
    
    setHabits(prevHabits => 
      prevHabits.map(habit => {
        if (habit.id === habitId) {
          const newHistory = { ...habit.completionHistory };
          newHistory[today] = !newHistory[today];
          
          // Recalculate streaks
          const dates = Object.keys(newHistory).sort().reverse();
          let currentStreak = 0;
          let bestStreak = 0;
          let tempStreak = 0;
          
          for (let i = 0; i < dates.length; i++) {
            if (newHistory[dates[i]]) {
              if (i === 0 || currentStreak > 0) {
                currentStreak++;
              }
              tempStreak++;
            } else {
              if (i === 0) break;
              tempStreak = 0;
            }
            bestStreak = Math.max(bestStreak, tempStreak);
          }
          
          return {
            ...habit,
            completionHistory: newHistory,
            currentStreak,
            bestStreak: Math.max(bestStreak, habit.bestStreak),
            earnedBadges: badges.filter(badge => 
              badge.requirement <= bestStreak || 
              (badge.requirement === 'morning' && Math.random() > 0.7)
            )
          };
        }
        return habit;
      })
    );
    
    // Update today's progress
    setTodayProgress(getTodayCompletion());
  };

  const handleCreateHabit = (habitData) => {
    const newHabit = {
      id: Date.now().toString(),
      ...habitData,
      createdAt: new Date().toISOString().split('T')[0],
      completionHistory: {},
      currentStreak: 0,
      bestStreak: 0,
      totalDays: 0,
      earnedBadges: []
    };
    
    setHabits([...habits, newHabit]);
    setShowHabitForm(false);
  };

  const handleEditHabit = (habitData) => {
    setHabits(habits.map(habit => 
      habit.id === editingHabit.id 
        ? { ...habit, ...habitData }
        : habit
    ));
    setEditingHabit(null);
  };

  const handleDeleteHabit = (habitId) => {
    setHabits(habits.filter(habit => habit.id !== habitId));
  };

  const totalEarnedBadges = habits.reduce((acc, habit) => acc + habit.earnedBadges.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Habit Tracker
              </h1>
              <p className="text-muted-foreground">Build better habits, one day at a time</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
                className="data-[state=checked]:bg-blue-600"
              />
              <Moon className="w-4 h-4" />
            </div>
            <Button 
              onClick={() => setShowHabitForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Habit
            </Button>
          </div>
        </div>

        {/* Today's Progress */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {todayProgress.completed}/{todayProgress.total}
                </div>
                <div className="text-sm text-muted-foreground">Habits Completed</div>
                <Progress value={todayProgress.percentage} className="mt-2 h-2" />
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {habits.reduce((acc, habit) => acc + habit.currentStreak, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Active Streaks</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {totalEarnedBadges}
                </div>
                <div className="text-sm text-muted-foreground">Badges Earned</div>
                <div className="flex justify-center gap-1 mt-2">
                  {habits.slice(0, 3).map(habit => 
                    habit.earnedBadges.slice(0, 2).map(badge => (
                      <Badge key={badge.id} variant="outline" className="text-xs">
                        {badge.icon}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <TabsTrigger value="habits" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Habits
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Badges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="habits" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits.map(habit => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={handleHabitToggle}
                  onEdit={setEditingHabit}
                  onDelete={handleDeleteHabit}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView habits={habits} onToggle={handleHabitToggle} />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressView habits={habits} />
          </TabsContent>

          <TabsContent value="badges">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits.map(habit => (
                <Card key={habit.id} className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-2xl">{habit.icon}</span>
                      {habit.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {habit.earnedBadges.length > 0 ? (
                        habit.earnedBadges.map(badge => (
                          <div key={badge.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-lg">
                            <span className="text-2xl">{badge.icon}</span>
                            <div>
                              <div className="font-medium">{badge.name}</div>
                              <div className="text-sm text-muted-foreground">{badge.description}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          No badges earned yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Habit Form Modal */}
      {(showHabitForm || editingHabit) && (
        <HabitForm
          habit={editingHabit}
          onSave={editingHabit ? handleEditHabit : handleCreateHabit}
          onCancel={() => {
            setShowHabitForm(false);
            setEditingHabit(null);
          }}
        />
      )}
    </div>
  );
};