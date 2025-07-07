import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// API service class
class HabitAPI {
  // Habit CRUD operations
  async getAllHabits() {
    try {
      const response = await axios.get(`${API}/habits`);
      return response.data;
    } catch (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
  }

  async createHabit(habitData) {
    try {
      const response = await axios.post(`${API}/habits`, habitData);
      return response.data;
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  }

  async updateHabit(habitId, habitData) {
    try {
      const response = await axios.put(`${API}/habits/${habitId}`, habitData);
      return response.data;
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }

  async deleteHabit(habitId) {
    try {
      const response = await axios.delete(`${API}/habits/${habitId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }

  async getHabit(habitId) {
    try {
      const response = await axios.get(`${API}/habits/${habitId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching habit:', error);
      throw error;
    }
  }

  // Completion operations
  async toggleHabitCompletion(habitId, date, completed) {
    try {
      const response = await axios.post(`${API}/habits/${habitId}/completions`, {
        date: date,
        completed: completed
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      throw error;
    }
  }

  async getHabitCompletions(habitId) {
    try {
      const response = await axios.get(`${API}/habits/${habitId}/completions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching habit completions:', error);
      throw error;
    }
  }

  // Statistics and analytics
  async getHabitStats() {
    try {
      const response = await axios.get(`${API}/habits/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching habit stats:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const response = await axios.get(`${API}/categories`);
      return response.data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async getBadges() {
    try {
      const response = await axios.get(`${API}/badges`);
      return response.data.badges;
    } catch (error) {
      console.error('Error fetching badges:', error);
      throw error;
    }
  }

  // Utility methods
  getTodayCompletion(habits) {
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(habit => habit.completion_history && habit.completion_history[today]);
    return {
      completed: completedToday.length,
      total: habits.length,
      percentage: Math.round((completedToday.length / habits.length) * 100)
    };
  }

  getWeeklyProgress(habits) {
    const today = new Date();
    const weekDays = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      weekDays.push(date.toISOString().split('T')[0]);
    }
    
    return weekDays.map(date => {
      const completed = habits.filter(habit => 
        habit.completion_history && habit.completion_history[date]
      ).length;
      return {
        date,
        completed,
        total: habits.length,
        percentage: Math.round((completed / habits.length) * 100)
      };
    });
  }

  // Local storage helpers (for offline support)
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  loadFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }

  clearLocalStorage() {
    try {
      localStorage.removeItem('habits');
      localStorage.removeItem('completions');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

// Export singleton instance
export const habitAPI = new HabitAPI();
export default habitAPI;