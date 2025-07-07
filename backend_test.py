#!/usr/bin/env python3
import requests
import json
import datetime
import uuid
import time
from typing import Dict, Any, List, Optional

# Base URL from frontend/.env
BASE_URL = "https://fb52f469-39dc-4c87-9f3c-80c38d32bc73.preview.emergentagent.com/api"

# Test data
TEST_HABIT = {
    "name": "Morning Meditation",
    "description": "15 minutes of mindfulness meditation each morning",
    "category": "mindfulness",
    "icon": "🧘",
    "color": "#8A2BE2"
}

TEST_HABIT_UPDATE = {
    "name": "Evening Meditation",
    "description": "20 minutes of mindfulness meditation each evening",
    "category": "mindfulness",
    "icon": "🧘‍♀️",
    "color": "#9370DB"
}

# Helper functions
def print_test_result(test_name: str, passed: bool, response: Optional[requests.Response] = None, error: Optional[str] = None):
    """Print test result with formatting"""
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"\n{status} - {test_name}")
    
    if response:
        print(f"  Status Code: {response.status_code}")
        try:
            print(f"  Response: {json.dumps(response.json(), indent=2)[:500]}...")
        except:
            print(f"  Response: {response.text[:500]}...")
    
    if error:
        print(f"  Error: {error}")

def run_test(test_func):
    """Decorator to run a test function and handle exceptions"""
    def wrapper(*args, **kwargs):
        try:
            return test_func(*args, **kwargs)
        except Exception as e:
            print_test_result(test_func.__name__, False, error=str(e))
            return False
    return wrapper

# Test functions
@run_test
def test_health_check():
    """Test the health check endpoint"""
    response = requests.get(f"{BASE_URL}/")
    assert response.status_code == 200
    assert "message" in response.json()
    print_test_result("Health Check", True, response)
    return True

@run_test
def test_get_categories():
    """Test getting habit categories"""
    response = requests.get(f"{BASE_URL}/categories")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert len(data["categories"]) > 0
    assert "id" in data["categories"][0]
    assert "name" in data["categories"][0]
    assert "color" in data["categories"][0]
    print_test_result("Get Categories", True, response)
    return True

@run_test
def test_get_badges():
    """Test getting available badges"""
    response = requests.get(f"{BASE_URL}/badges")
    assert response.status_code == 200
    data = response.json()
    assert "badges" in data
    assert len(data["badges"]) > 0
    # Check for specific badges
    assert "streak-3" in data["badges"]
    assert "streak-7" in data["badges"]
    assert "streak-30" in data["badges"]
    assert "streak-100" in data["badges"]
    assert "consistent" in data["badges"]
    print_test_result("Get Badges", True, response)
    return True

@run_test
def test_create_habit():
    """Test creating a new habit"""
    response = requests.post(f"{BASE_URL}/habits", json=TEST_HABIT)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["name"] == TEST_HABIT["name"]
    assert data["description"] == TEST_HABIT["description"]
    assert data["category"] == TEST_HABIT["category"]
    assert data["icon"] == TEST_HABIT["icon"]
    assert data["color"] == TEST_HABIT["color"]
    assert "created_at" in data
    assert "current_streak" in data
    assert "best_streak" in data
    assert "total_days" in data
    assert "completion_rate" in data
    assert "completion_history" in data
    assert "earned_badges" in data
    print_test_result("Create Habit", True, response)
    return data["id"]

@run_test
def test_get_all_habits():
    """Test getting all habits"""
    response = requests.get(f"{BASE_URL}/habits")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "id" in data[0]
        assert "name" in data[0]
        assert "category" in data[0]
        assert "current_streak" in data[0]
        assert "best_streak" in data[0]
        assert "completion_history" in data[0]
    print_test_result("Get All Habits", True, response)
    return True

@run_test
def test_get_habit(habit_id: str):
    """Test getting a specific habit"""
    response = requests.get(f"{BASE_URL}/habits/{habit_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == habit_id
    assert "name" in data
    assert "description" in data
    assert "category" in data
    assert "icon" in data
    assert "color" in data
    assert "created_at" in data
    assert "current_streak" in data
    assert "best_streak" in data
    assert "total_days" in data
    assert "completion_rate" in data
    assert "completion_history" in data
    assert "earned_badges" in data
    print_test_result("Get Specific Habit", True, response)
    return True

@run_test
def test_update_habit(habit_id: str):
    """Test updating a habit"""
    response = requests.put(f"{BASE_URL}/habits/{habit_id}", json=TEST_HABIT_UPDATE)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == habit_id
    assert data["name"] == TEST_HABIT_UPDATE["name"]
    assert data["description"] == TEST_HABIT_UPDATE["description"]
    assert data["category"] == TEST_HABIT_UPDATE["category"]
    assert data["icon"] == TEST_HABIT_UPDATE["icon"]
    assert data["color"] == TEST_HABIT_UPDATE["color"]
    print_test_result("Update Habit", True, response)
    return True

@run_test
def test_toggle_habit_completion(habit_id: str):
    """Test toggling habit completion"""
    today = datetime.date.today().isoformat()
    
    # Mark as completed
    completion_data = {"date": today, "completed": True}
    response = requests.post(f"{BASE_URL}/habits/{habit_id}/completions", json=completion_data)
    assert response.status_code == 200
    assert "message" in response.json()
    print_test_result("Toggle Habit Completion (Complete)", True, response)
    
    # Get habit to verify streak
    response = requests.get(f"{BASE_URL}/habits/{habit_id}")
    data = response.json()
    assert data["current_streak"] >= 1
    assert today in data["completion_history"]
    assert data["completion_history"][today] is True
    
    # Mark as not completed
    completion_data = {"date": today, "completed": False}
    response = requests.post(f"{BASE_URL}/habits/{habit_id}/completions", json=completion_data)
    assert response.status_code == 200
    assert "message" in response.json()
    print_test_result("Toggle Habit Completion (Uncomplete)", True, response)
    
    # Get habit to verify streak reset
    response = requests.get(f"{BASE_URL}/habits/{habit_id}")
    data = response.json()
    assert today in data["completion_history"]
    assert data["completion_history"][today] is False
    
    # Mark as completed again for further tests
    completion_data = {"date": today, "completed": True}
    response = requests.post(f"{BASE_URL}/habits/{habit_id}/completions", json=completion_data)
    
    return True

@run_test
def test_get_habit_completions(habit_id: str):
    """Test getting habit completions"""
    response = requests.get(f"{BASE_URL}/habits/{habit_id}/completions")
    assert response.status_code == 200
    data = response.json()
    assert "habit_id" in data
    assert data["habit_id"] == habit_id
    assert "completions" in data
    assert isinstance(data["completions"], list)
    if len(data["completions"]) > 0:
        assert "date" in data["completions"][0]
        assert "completed" in data["completions"][0]
    print_test_result("Get Habit Completions", True, response)
    return True

@run_test
def test_get_habit_stats():
    """Test getting overall habit statistics"""
    response = requests.get(f"{BASE_URL}/habits/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_habits" in data
    assert "active_streaks" in data
    assert "today_completed" in data
    assert "today_total" in data
    assert "today_percentage" in data
    assert "weekly_progress" in data
    assert "monthly_progress" in data
    assert isinstance(data["weekly_progress"], list)
    assert isinstance(data["monthly_progress"], list)
    print_test_result("Get Habit Stats", True, response)
    return True

@run_test
def test_streak_calculation(habit_id: str):
    """Test streak calculation logic"""
    today = datetime.date.today()
    yesterday = (today - datetime.timedelta(days=1)).isoformat()
    day_before_yesterday = (today - datetime.timedelta(days=2)).isoformat()
    
    # Mark yesterday as completed
    completion_data = {"date": yesterday, "completed": True}
    response = requests.post(f"{BASE_URL}/habits/{habit_id}/completions", json=completion_data)
    assert response.status_code == 200
    
    # Mark day before yesterday as completed
    completion_data = {"date": day_before_yesterday, "completed": True}
    response = requests.post(f"{BASE_URL}/habits/{habit_id}/completions", json=completion_data)
    assert response.status_code == 200
    
    # Get habit to verify streak
    response = requests.get(f"{BASE_URL}/habits/{habit_id}")
    data = response.json()
    assert data["current_streak"] >= 3  # Today + yesterday + day before
    assert data["best_streak"] >= 3
    
    print_test_result("Streak Calculation", True, response)
    return True

@run_test
def test_badge_earning(habit_id: str):
    """Test badge earning logic"""
    # Get habit to check badges
    response = requests.get(f"{BASE_URL}/habits/{habit_id}")
    data = response.json()
    
    # Should have earned at least the 3-day streak badge
    assert "streak-3" in data["earned_badges"]
    
    print_test_result("Badge Earning", True, response)
    return True

@run_test
def test_error_handling():
    """Test error handling for invalid data and requests"""
    # Test invalid habit ID
    invalid_id = str(uuid.uuid4())
    response = requests.get(f"{BASE_URL}/habits/{invalid_id}")
    assert response.status_code == 404
    print_test_result("Error Handling - Invalid Habit ID", True, response)
    
    # Test invalid habit data
    invalid_habit = {"name": ""}  # Missing required fields
    response = requests.post(f"{BASE_URL}/habits", json=invalid_habit)
    assert response.status_code != 200  # Should not be successful
    print_test_result("Error Handling - Invalid Habit Data", True, response)
    
    return True

@run_test
def test_delete_habit(habit_id: str):
    """Test deleting a habit"""
    response = requests.delete(f"{BASE_URL}/habits/{habit_id}")
    assert response.status_code == 200
    assert "message" in response.json()
    
    # Verify habit is deleted
    response = requests.get(f"{BASE_URL}/habits/{habit_id}")
    assert response.status_code == 404
    
    print_test_result("Delete Habit", True, response)
    return True

def run_all_tests():
    """Run all tests in sequence"""
    print("\n🔍 STARTING HABIT TRACKER API TESTS 🔍\n")
    
    # Basic endpoints
    test_health_check()
    test_get_categories()
    test_get_badges()
    
    # Create a habit for further tests
    habit_id = test_create_habit()
    if not habit_id:
        print("\n❌ Cannot continue tests without creating a habit")
        return False
    
    # Test habit operations
    test_get_all_habits()
    test_get_habit(habit_id)
    test_update_habit(habit_id)
    
    # Test completion and streaks
    test_toggle_habit_completion(habit_id)
    test_get_habit_completions(habit_id)
    test_streak_calculation(habit_id)
    test_badge_earning(habit_id)
    
    # Test stats
    test_get_habit_stats()
    
    # Test error handling
    test_error_handling()
    
    # Finally, delete the test habit
    test_delete_habit(habit_id)
    
    print("\n✅ ALL TESTS COMPLETED ✅\n")
    return True

if __name__ == "__main__":
    run_all_tests()