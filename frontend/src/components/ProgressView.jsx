import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart3, TrendingUp, Calendar, Target, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeeklyProgress } from '../mock/data';

export const ProgressView = ({ habits }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const getHabitStats = (habit) => {
    const completionHistory = habit.completion_history || {};
    const totalDays = Object.keys(completionHistory).length;
    const completedDays = Object.values(completionHistory).filter(Boolean).length;
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    
    return {
      totalDays,
      completedDays,
      completionRate: habit.completion_rate || completionRate,
      currentStreak: habit.current_streak || 0,
      bestStreak: habit.best_streak || 0
    };
  };

  const getWeeklyData = (weekOffset = 0) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }
    
    return weekDays.map(date => {
      const dateString = date.toISOString().split('T')[0];
      const completed = habits.filter(habit => 
        habit.completion_history && habit.completion_history[dateString]
      ).length;
      const percentage = habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0;
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        completed,
        total: habits.length,
        percentage
      };
    });
  };

  const getMonthlyData = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const monthData = [];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      const completed = habits.filter(habit => 
        habit.completion_history && habit.completion_history[dateString]
      ).length;
      const percentage = habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0;
      
      monthData.push({
        date: day,
        completed,
        total: habits.length,
        percentage
      });
    }
    
    return monthData;
  };

  const weeklyData = getWeeklyData(currentWeekOffset);
  const monthlyData = getMonthlyData();
  
  const overallStats = {
    totalHabits: habits.length,
    activeStreaks: habits.filter(habit => habit.currentStreak > 0).length,
    totalBadges: habits.reduce((acc, habit) => acc + habit.earnedBadges.length, 0),
    averageCompletion: habits.length > 0 
      ? Math.round(habits.reduce((acc, habit) => acc + getHabitStats(habit).last30DaysRate, 0) / habits.length)
      : 0
  };

  const navigateWeek = (direction) => {
    setCurrentWeekOffset(prev => prev + direction);
  };

  const renderHabitProgress = () => (
    <div className="space-y-4">
      {habits.map(habit => {
        const stats = getHabitStats(habit);
        
        return (
          <Card key={habit.id} className={`${habit.color} border-0 shadow-sm`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{habit.icon}</span>
                  <div>
                    <h4 className="font-medium">{habit.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {stats.completedDays} days total
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {stats.currentStreak} current streak
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{stats.last30DaysRate}%</div>
                  <div className="text-xs text-muted-foreground">30-day rate</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall completion</span>
                  <span>{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="text-center p-2 bg-white/60 dark:bg-slate-700/60 rounded">
                  <div className="text-lg font-bold text-orange-600">{stats.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Current Streak</div>
                </div>
                <div className="text-center p-2 bg-white/60 dark:bg-slate-700/60 rounded">
                  <div className="text-lg font-bold text-yellow-600">{stats.bestStreak}</div>
                  <div className="text-xs text-muted-foreground">Best Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderWeeklyChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateWeek(-1)}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Week
        </Button>
        
        <h3 className="font-medium">
          {currentWeekOffset === 0 ? 'This Week' : `${Math.abs(currentWeekOffset)} week${Math.abs(currentWeekOffset) > 1 ? 's' : ''} ${currentWeekOffset > 0 ? 'ahead' : 'ago'}`}
        </h3>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateWeek(1)}
          className="flex items-center gap-2"
        >
          Next Week
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {weeklyData.map((day, index) => (
          <div key={index} className="text-center">
            <div className="text-sm font-medium mb-2">{day.date}</div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-600 mb-1">{day.percentage}%</div>
              <div className="text-xs text-muted-foreground">{day.completed}/{day.total}</div>
              <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${day.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonthlyChart = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-center">
        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
      </h3>
      
      <div className="grid grid-cols-7 gap-1">
        {monthlyData.map((day, index) => (
          <div key={index} className="aspect-square">
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded p-1 flex flex-col items-center justify-center">
              <div className="text-xs font-medium">{day.date}</div>
              <div className="text-xs text-blue-600 font-bold">{day.percentage}%</div>
              <div 
                className="w-2 h-2 rounded-full mt-1"
                style={{ 
                  backgroundColor: day.percentage === 100 ? '#10b981' : 
                                 day.percentage >= 75 ? '#3b82f6' : 
                                 day.percentage >= 50 ? '#f59e0b' : 
                                 day.percentage >= 25 ? '#f97316' : 
                                 day.percentage > 0 ? '#ef4444' : '#6b7280'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{overallStats.totalHabits}</div>
              <div className="text-sm text-muted-foreground">Total Habits</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">{overallStats.activeStreaks}</div>
              <div className="text-sm text-muted-foreground">Active Streaks</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">{overallStats.totalBadges}</div>
              <div className="text-sm text-muted-foreground">Badges Earned</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">{overallStats.averageCompletion}%</div>
              <div className="text-sm text-muted-foreground">Avg Completion</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Progress */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Detailed Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="habits">Habits</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            
            <TabsContent value="habits" className="mt-4">
              {renderHabitProgress()}
            </TabsContent>
            
            <TabsContent value="weekly" className="mt-4">
              {renderWeeklyChart()}
            </TabsContent>
            
            <TabsContent value="monthly" className="mt-4">
              {renderMonthlyChart()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};