import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Plus, Sun, Moon, Calendar, BarChart3, Target, Award, Loader2 } from 'lucide-react';
import { HabitCard } from './HabitCard';
import { CalendarView } from './CalendarView';
import { ProgressView } from './ProgressView';
import { HabitForm } from './HabitForm';
import { useToast } from '../hooks/use-toast';
import habitAPI from '../services/api';

export const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [badges, setBadges] = useState({});
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [activeTab, setActiveTab] = useState('habits');
  const [todayProgress, setTodayProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Apply theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load habits, categories, and badges in parallel
      const [habitsData, categoriesData, badgesData] = await Promise.all([
        habitAPI.getAllHabits(),
        habitAPI.getCategories(),
        habitAPI.getBadges()
      ]);

      setHabits(habitsData);
      setCategories(categoriesData);
      setBadges(badgesData);
      
      // Calculate today's progress
      const progress = habitAPI.getTodayCompletion(habitsData);
      setTodayProgress(progress);
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load habits. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHabitToggle = async (habitId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const habit = habits.find(h => h.id === habitId);
      
      if (!habit) return;
      
      const currentlyCompleted = habit.completion_history && habit.completion_history[today];
      const newCompletedStatus = !currentlyCompleted;
      
      // Optimistically update UI
      setHabits(prevHabits => 
        prevHabits.map(h => {
          if (h.id === habitId) {
            const newHistory = { ...h.completion_history };
            newHistory[today] = newCompletedStatus;
            return { ...h, completion_history: newHistory };
          }
          return h;
        })
      );
      
      // Update backend
      await habitAPI.toggleHabitCompletion(habitId, today, newCompletedStatus);
      
      // Refresh habit data to get updated streaks and stats
      const updatedHabit = await habitAPI.getHabit(habitId);
      setHabits(prevHabits => 
        prevHabits.map(h => h.id === habitId ? updatedHabit : h)
      );
      
      // Update today's progress
      const updatedHabits = habits.map(h => h.id === habitId ? updatedHabit : h);
      const progress = habitAPI.getTodayCompletion(updatedHabits);
      setTodayProgress(progress);
      
      toast({
        title: newCompletedStatus ? "Habit completed!" : "Habit unchecked",
        description: `${habit.name} for today`,
        variant: newCompletedStatus ? "default" : "secondary"
      });
      
    } catch (error) {
      console.error('Error toggling habit:', error);
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive"
      });
      
      // Revert optimistic update
      loadInitialData();
    }
  };

  const handleCreateHabit = async (habitData) => {
    try {
      const newHabit = await habitAPI.createHabit(habitData);
      setHabits([...habits, newHabit]);
      setShowHabitForm(false);
      
      // Update progress
      const updatedHabits = [...habits, newHabit];
      const progress = habitAPI.getTodayCompletion(updatedHabits);
      setTodayProgress(progress);
      
      toast({
        title: "Habit created!",
        description: `${habitData.name} has been added to your habits.`
      });
      
    } catch (error) {
      console.error('Error creating habit:', error);
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditHabit = async (habitData) => {
    try {
      const updatedHabit = await habitAPI.updateHabit(editingHabit.id, habitData);
      setHabits(habits.map(habit => 
        habit.id === editingHabit.id ? updatedHabit : habit
      ));
      setEditingHabit(null);
      
      toast({
        title: "Habit updated!",
        description: `${habitData.name} has been updated.`
      });
      
    } catch (error) {
      console.error('Error updating habit:', error);
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      await habitAPI.deleteHabit(habitId);
      const updatedHabits = habits.filter(habit => habit.id !== habitId);
      setHabits(updatedHabits);
      
      // Update progress
      const progress = habitAPI.getTodayCompletion(updatedHabits);
      setTodayProgress(progress);
      
      toast({
        title: "Habit deleted",
        description: "Habit has been removed from your list."
      });
      
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive"
      });
    }
  };

  const totalEarnedBadges = habits.reduce((acc, habit) => acc + (habit.earned_badges?.length || 0), 0);
  const totalActiveStreaks = habits.reduce((acc, habit) => acc + (habit.current_streak || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading your habits...</p>
        </div>
      </div>
    );
  }

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
                  {totalActiveStreaks}
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
                    habit.earned_badges?.slice(0, 2).map(badgeId => (
                      <Badge key={badgeId} variant="outline" className="text-xs">
                        {badges[badgeId]?.icon || '🏆'}
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
            {habits.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No habits yet</h3>
                <p className="text-muted-foreground mb-4">Create your first habit to get started!</p>
                <Button onClick={() => setShowHabitForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Habit
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {habits.map(habit => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onToggle={handleHabitToggle}
                    onEdit={setEditingHabit}
                    onDelete={handleDeleteHabit}
                    categories={categories}
                  />
                ))}
              </div>
            )}
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
                      {habit.earned_badges && habit.earned_badges.length > 0 ? (
                        habit.earned_badges.map(badgeId => (
                          <div key={badgeId} className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-lg">
                            <span className="text-2xl">{badges[badgeId]?.icon || '🏆'}</span>
                            <div>
                              <div className="font-medium">{badges[badgeId]?.name || 'Achievement'}</div>
                              <div className="text-sm text-muted-foreground">{badges[badgeId]?.description || 'Well done!'}</div>
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
          categories={categories}
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