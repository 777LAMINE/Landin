import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChevronLeft, ChevronRight, Calendar, Grid3x3 } from 'lucide-react';

export const CalendarView = ({ habits, onToggle }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('monthly');

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getWeekDays = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getDayCompletionData = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const completedHabits = habits.filter(habit => habit.completionHistory[dateString]);
    const completionPercentage = habits.length > 0 ? Math.round((completedHabits.length / habits.length) * 100) : 0;
    
    return {
      completed: completedHabits.length,
      total: habits.length,
      percentage: completionPercentage,
      habits: completedHabits
    };
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getCompletionColor = (percentage) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    if (percentage > 0) return 'bg-red-500';
    return 'bg-gray-200 dark:bg-gray-600';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderMonthlyView = () => {
    const days = getDaysInMonth(currentDate);
    
    return (
      <div className="space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth(-1)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <h3 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth(1)}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="p-2"></div>;
            }
            
            const dayData = getDayCompletionData(date);
            const completionColor = getCompletionColor(dayData.percentage);
            
            return (
              <div
                key={index}
                className={`p-2 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                  isToday(date) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="text-center">
                  <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                  <div className={`w-6 h-6 rounded-full mx-auto ${completionColor}`} title={`${dayData.percentage}% completed`}>
                    {dayData.percentage > 0 && (
                      <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold">
                        {dayData.percentage}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {dayData.completed}/{dayData.total}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeeklyView = () => {
    const weekDays = getWeekDays(currentDate);
    
    return (
      <div className="space-y-4">
        {/* Week Navigation */}
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
          
          <h3 className="text-xl font-semibold">
            {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
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

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((date, index) => {
            const dayData = getDayCompletionData(date);
            
            return (
              <Card key={index} className={`${isToday(date) ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="text-center">
                    <div className="text-sm font-medium text-muted-foreground">
                      {dayNames[date.getDay()]}
                    </div>
                    <div className="text-lg font-bold">{date.getDate()}</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">
                      {dayData.completed}/{dayData.total} completed
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {dayData.percentage}%
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {habits.map(habit => {
                      const dateString = date.toISOString().split('T')[0];
                      const isCompleted = habit.completionHistory[dateString];
                      
                      return (
                        <div
                          key={habit.id}
                          className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer transition-all ${
                            isCompleted
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                          onClick={() => onToggle(habit.id)}
                        >
                          <span className="text-sm">{habit.icon}</span>
                          <span className="truncate">{habit.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Calendar View
          </CardTitle>
          
          <Tabs value={view} onValueChange={setView} className="w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Grid3x3 className="w-4 h-4" />
                Weekly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        {view === 'monthly' ? renderMonthlyView() : renderWeeklyView()}
        
        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-2">Completion Legend</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>100% Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>75-99% Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>50-74% Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span>25-49% Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>1-24% Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
              <span>0% Complete</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};