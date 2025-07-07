import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { MoreHorizontal, Edit, Trash2, Flame, Trophy, Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

export const HabitCard = ({ habit, onToggle, onEdit, onDelete, categories }) => {
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completion_history && habit.completion_history[today] || false;
  const category = categories.find(c => c.id === habit.category);
  
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
              {habit.current_streak || 0}
            </div>
          </div>
          
          <div className="text-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Best</span>
            </div>
            <div className="text-xl font-bold text-yellow-600">
              {habit.best_streak || 0}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion rate</span>
            <span className="font-medium">{habit.completion_rate || 0}%</span>
          </div>
          <Progress value={habit.completion_rate || 0} className="h-2" />
        </div>

        {/* Badges */}
        {habit.earned_badges && habit.earned_badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {habit.earned_badges.slice(0, 3).map(badgeId => (
              <Badge
                key={badgeId}
                variant="outline"
                className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 border-none"
              >
                🏆 Badge
              </Badge>
            ))}
            {habit.earned_badges.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{habit.earned_badges.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Description */}
        {habit.description && (
          <p className="text-sm text-muted-foreground">{habit.description}</p>
        )}

        {/* Total Days */}
        <div className="text-xs text-muted-foreground text-center">
          {habit.total_days || 0} days tracked
        </div>
      </CardContent>
    </Card>
  );
};