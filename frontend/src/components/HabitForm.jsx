import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';

const habitIcons = ['💧', '📚', '🏃‍♂️', '🧘‍♀️', '📓', '🍎', '💪', '🌅', '🎯', '🎨', '🎵', '🌱'];
const colorOptions = [
  { name: 'Blue', value: 'bg-blue-50 border-blue-200' },
  { name: 'Purple', value: 'bg-purple-50 border-purple-200' },
  { name: 'Green', value: 'bg-green-50 border-green-200' },
  { name: 'Orange', value: 'bg-orange-50 border-orange-200' },
  { name: 'Pink', value: 'bg-pink-50 border-pink-200' },
  { name: 'Indigo', value: 'bg-indigo-50 border-indigo-200' },
  { name: 'Yellow', value: 'bg-yellow-50 border-yellow-200' },
  { name: 'Gray', value: 'bg-gray-50 border-gray-200' }
];

export const HabitForm = ({ habit, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: habit?.name || '',
    description: habit?.description || '',
    category: habit?.category || '',
    icon: habit?.icon || '🎯',
    color: habit?.color || 'bg-blue-50 border-blue-200'
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Habit name is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {habit ? 'Edit Habit' : 'Create New Habit'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Habit Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Read for 30 minutes"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${category.color.split(' ')[0]}`}></span>
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {habitIcons.map(icon => (
                <Card 
                  key={icon}
                  className={`cursor-pointer transition-all hover:scale-105 ${formData.icon === icon ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setFormData({ ...formData, icon })}
                >
                  <CardContent className="p-3 text-center">
                    <span className="text-2xl">{icon}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Color Theme</Label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map(color => (
                <Card 
                  key={color.value}
                  className={`cursor-pointer transition-all hover:scale-105 ${formData.color === color.value ? 'ring-2 ring-blue-500' : ''} ${color.value}`}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                >
                  <CardContent className="p-3 text-center">
                    <span className="text-sm font-medium">{color.name}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <Card className={`${formData.color} transition-all duration-200`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{formData.icon}</span>
                  <div>
                    <div className="font-medium">{formData.name || 'Habit Name'}</div>
                    {formData.description && (
                      <div className="text-sm text-muted-foreground">{formData.description}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {habit ? 'Update Habit' : 'Create Habit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};