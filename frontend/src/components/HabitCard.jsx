import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { MoreHorizontal, Edit, Trash2, Flame, Trophy, Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { categories } from '../mock/data';

export const HabitCard = ({ habit, onToggle, onEdit, onDelete }) => {
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completionHistory[today] || false;
  const category = categories.find(c => c.id === habit.category);
  
  // Calculate completion rate for last 30 days
  const last30Days = Object.keys(habit.completionHistory)
    .filter(date => {
      const daysDiff = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
      return daysDiff <= 30;
    });
  
  const completionRate = last30Days.length > 0 
    ? Math.round((last30Days.filter(date => habit.completionHistory[date]).length / last30Days.length) * 100)
    : 0;

  return (
    <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-200 ${habit.color} backdrop-blur-sm hover:scale-105`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{habit.icon}</div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{habit.name}</CardTitle>
              {category && (
                <Badge variant="secondary" className={`mt-1 ${category.color} text-xs`}>
                  {category.name}
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(habit)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(habit.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Today's Completion */}
        <div className="flex items-center gap-3">
          <Checkbox
            id={`habit-${habit.id}`}
            checked={isCompletedToday}
            onCheckedChange={() => onToggle(habit.id)}
            className="h-5 w-5"
          />
          <label 
            htmlFor={`habit-${habit.id}`}
            className={`text-sm font-medium cursor-pointer ${isCompletedToday ? 'line-through text-muted-foreground' : ''}`}
          >
            Complete for today
          </label>
        </div>

        {/* Streaks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Current</span>
            </div>
            <div className="text-xl font-bold text-orange-600">
              {habit.currentStreak}
            </div>
          </div>
          
          <div className="text-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Best</span>
            </div>
            <div className="text-xl font-bold text-yellow-600">
              {habit.bestStreak}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>30-day completion</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Badges */}
        {habit.earnedBadges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {habit.earnedBadges.slice(0, 3).map(badge => (
              <Badge
                key={badge.id}
                variant="outline"
                className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 border-none"
              >
                {badge.icon} {badge.name}
              </Badge>
            ))}
            {habit.earnedBadges.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{habit.earnedBadges.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Description */}
        {habit.description && (
          <p className="text-sm text-muted-foreground">{habit.description}</p>
        )}
      </CardContent>
    </Card>
  );
};