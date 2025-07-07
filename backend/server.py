from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, date
from collections import defaultdict


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class Habit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    category: str
    icon: str
    color: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: str = "default"  # For future auth support

class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    icon: str
    color: str

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class HabitCompletion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    habit_id: str
    date: date
    completed: bool = True
    user_id: str = "default"

class HabitCompletionToggle(BaseModel):
    date: date
    completed: bool

class HabitStats(BaseModel):
    total_habits: int
    active_streaks: int
    today_completed: int
    today_total: int
    today_percentage: int
    weekly_progress: List[Dict]
    monthly_progress: List[Dict]

class HabitWithStats(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: str
    icon: str
    color: str
    created_at: datetime
    current_streak: int
    best_streak: int
    total_days: int
    completion_rate: int
    completion_history: Dict[str, bool]
    earned_badges: List[str]

# Badge definitions
BADGES = {
    'streak-3': {'name': 'Getting Started', 'description': '3 day streak', 'icon': '🌱', 'requirement': 3},
    'streak-7': {'name': 'Week Warrior', 'description': '7 day streak', 'icon': '🔥', 'requirement': 7},
    'streak-30': {'name': 'Month Master', 'description': '30 day streak', 'icon': '💪', 'requirement': 30},
    'streak-100': {'name': 'Century Club', 'description': '100 day streak', 'icon': '💯', 'requirement': 100},
    'consistent': {'name': 'Consistency King', 'description': '90% completion rate', 'icon': '👑', 'requirement': 90},
}

# Helper functions
def calculate_streaks(completion_history: Dict[str, bool]) -> tuple:
    """Calculate current and best streak from completion history"""
    if not completion_history:
        return 0, 0
    
    dates = sorted(completion_history.keys(), reverse=True)
    current_streak = 0
    best_streak = 0
    temp_streak = 0
    
    # Calculate current streak (from today backwards)
    for i, date_str in enumerate(dates):
        if completion_history[date_str]:
            if i == 0 or current_streak > 0:
                current_streak += 1
            temp_streak += 1
        else:
            if i == 0:
                current_streak = 0
                break
            temp_streak = 0
        best_streak = max(best_streak, temp_streak)
    
    return current_streak, best_streak

def get_earned_badges(current_streak: int, best_streak: int, completion_rate: int) -> List[str]:
    """Get list of earned badge IDs based on stats"""
    earned = []
    
    # Streak badges
    for badge_id, badge_info in BADGES.items():
        if badge_id.startswith('streak-'):
            requirement = badge_info['requirement']
            if best_streak >= requirement:
                earned.append(badge_id)
        elif badge_id == 'consistent':
            if completion_rate >= badge_info['requirement']:
                earned.append(badge_id)
    
    return earned

async def get_habit_completion_history(habit_id: str) -> Dict[str, bool]:
    """Get completion history for a habit"""
    completions = await db.habit_completions.find({"habit_id": habit_id}).to_list(1000)
    history = {}
    for completion in completions:
        date_str = completion['date'].isoformat() if isinstance(completion['date'], datetime) else str(completion['date'])
        history[date_str] = completion['completed']
    return history

async def get_habit_with_stats(habit_id: str) -> Optional[HabitWithStats]:
    """Get habit with calculated stats"""
    habit = await db.habits.find_one({"id": habit_id})
    if not habit:
        return None
    
    completion_history = await get_habit_completion_history(habit_id)
    
    # Calculate stats
    total_days = len(completion_history)
    completed_days = sum(1 for completed in completion_history.values() if completed)
    completion_rate = int((completed_days / total_days * 100)) if total_days > 0 else 0
    
    current_streak, best_streak = calculate_streaks(completion_history)
    earned_badges = get_earned_badges(current_streak, best_streak, completion_rate)
    
    return HabitWithStats(
        id=habit['id'],
        name=habit['name'],
        description=habit.get('description'),
        category=habit['category'],
        icon=habit['icon'],
        color=habit['color'],
        created_at=habit['created_at'],
        current_streak=current_streak,
        best_streak=best_streak,
        total_days=total_days,
        completion_rate=completion_rate,
        completion_history=completion_history,
        earned_badges=earned_badges
    )

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Habit Tracker API"}

# Habit CRUD operations
@api_router.post("/habits", response_model=HabitWithStats)
async def create_habit(habit_data: HabitCreate):
    """Create a new habit"""
    habit = Habit(**habit_data.dict())
    await db.habits.insert_one(habit.dict())
    
    # Return habit with stats (will be empty initially)
    return await get_habit_with_stats(habit.id)

@api_router.get("/habits", response_model=List[HabitWithStats])
async def get_all_habits():
    """Get all habits with stats"""
    habits = await db.habits.find({"user_id": "default"}).to_list(1000)
    
    habits_with_stats = []
    for habit in habits:
        habit_stats = await get_habit_with_stats(habit['id'])
        if habit_stats:
            habits_with_stats.append(habit_stats)
    
    return habits_with_stats

@api_router.get("/habits/{habit_id}", response_model=HabitWithStats)
async def get_habit(habit_id: str):
    """Get a specific habit with stats"""
    habit_stats = await get_habit_with_stats(habit_id)
    if not habit_stats:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit_stats

@api_router.put("/habits/{habit_id}", response_model=HabitWithStats)
async def update_habit(habit_id: str, habit_data: HabitUpdate):
    """Update a habit"""
    habit = await db.habits.find_one({"id": habit_id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in habit_data.dict().items() if v is not None}
    
    if update_data:
        await db.habits.update_one(
            {"id": habit_id},
            {"$set": update_data}
        )
    
    return await get_habit_with_stats(habit_id)

@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str):
    """Delete a habit and all its completions"""
    habit = await db.habits.find_one({"id": habit_id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Delete habit and all completions
    await db.habits.delete_one({"id": habit_id})
    await db.habit_completions.delete_many({"habit_id": habit_id})
    
    return {"message": "Habit deleted successfully"}

# Habit completion operations
@api_router.post("/habits/{habit_id}/completions")
async def toggle_habit_completion(habit_id: str, completion_data: HabitCompletionToggle):
    """Toggle habit completion for a specific date"""
    habit = await db.habits.find_one({"id": habit_id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Check if completion already exists
    existing_completion = await db.habit_completions.find_one({
        "habit_id": habit_id,
        "date": completion_data.date
    })
    
    if existing_completion:
        # Update existing completion
        await db.habit_completions.update_one(
            {"habit_id": habit_id, "date": completion_data.date},
            {"$set": {"completed": completion_data.completed}}
        )
    else:
        # Create new completion
        completion = HabitCompletion(
            habit_id=habit_id,
            date=completion_data.date,
            completed=completion_data.completed
        )
        await db.habit_completions.insert_one(completion.dict())
    
    return {"message": "Completion updated successfully"}

@api_router.get("/habits/{habit_id}/completions")
async def get_habit_completions(habit_id: str):
    """Get completion history for a habit"""
    habit = await db.habits.find_one({"id": habit_id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    completions = await db.habit_completions.find({"habit_id": habit_id}).to_list(1000)
    return {
        "habit_id": habit_id,
        "completions": [
            {
                "date": completion['date'].isoformat() if isinstance(completion['date'], datetime) else str(completion['date']),
                "completed": completion['completed']
            }
            for completion in completions
        ]
    }

# Statistics and analytics
@api_router.get("/habits/stats", response_model=HabitStats)
async def get_habit_stats():
    """Get overall habit statistics"""
    habits = await db.habits.find({"user_id": "default"}).to_list(1000)
    
    if not habits:
        return HabitStats(
            total_habits=0,
            active_streaks=0,
            today_completed=0,
            today_total=0,
            today_percentage=0,
            weekly_progress=[],
            monthly_progress=[]
        )
    
    # Calculate today's stats
    today = date.today()
    today_completions = await db.habit_completions.find({
        "date": today,
        "completed": True
    }).to_list(1000)
    
    today_completed = len(today_completions)
    today_total = len(habits)
    today_percentage = int((today_completed / today_total * 100)) if today_total > 0 else 0
    
    # Calculate active streaks
    active_streaks = 0
    for habit in habits:
        completion_history = await get_habit_completion_history(habit['id'])
        current_streak, _ = calculate_streaks(completion_history)
        if current_streak > 0:
            active_streaks += 1
    
    # Calculate weekly progress (last 7 days)
    weekly_progress = []
    for i in range(7):
        check_date = date.today()
        check_date = check_date.replace(day=check_date.day - i)
        
        day_completions = await db.habit_completions.find({
            "date": check_date,
            "completed": True
        }).to_list(1000)
        
        completed = len(day_completions)
        percentage = int((completed / today_total * 100)) if today_total > 0 else 0
        
        weekly_progress.append({
            "date": check_date.isoformat(),
            "completed": completed,
            "total": today_total,
            "percentage": percentage
        })
    
    weekly_progress.reverse()  # Show oldest to newest
    
    # Calculate monthly progress (last 30 days)
    monthly_progress = []
    for i in range(30):
        check_date = date.today()
        check_date = check_date.replace(day=check_date.day - i)
        
        day_completions = await db.habit_completions.find({
            "date": check_date,
            "completed": True
        }).to_list(1000)
        
        completed = len(day_completions)
        percentage = int((completed / today_total * 100)) if today_total > 0 else 0
        
        monthly_progress.append({
            "date": check_date.isoformat(),
            "completed": completed,
            "total": today_total,
            "percentage": percentage
        })
    
    monthly_progress.reverse()  # Show oldest to newest
    
    return HabitStats(
        total_habits=today_total,
        active_streaks=active_streaks,
        today_completed=today_completed,
        today_total=today_total,
        today_percentage=today_percentage,
        weekly_progress=weekly_progress,
        monthly_progress=monthly_progress
    )

@api_router.get("/categories")
async def get_categories():
    """Get available habit categories"""
    categories = [
        {'id': 'health', 'name': 'Health', 'color': 'bg-green-100 text-green-800'},
        {'id': 'productivity', 'name': 'Productivity', 'color': 'bg-blue-100 text-blue-800'},
        {'id': 'learning', 'name': 'Learning', 'color': 'bg-purple-100 text-purple-800'},
        {'id': 'fitness', 'name': 'Fitness', 'color': 'bg-orange-100 text-orange-800'},
        {'id': 'mindfulness', 'name': 'Mindfulness', 'color': 'bg-indigo-100 text-indigo-800'},
        {'id': 'social', 'name': 'Social', 'color': 'bg-pink-100 text-pink-800'},
        {'id': 'creative', 'name': 'Creative', 'color': 'bg-yellow-100 text-yellow-800'},
        {'id': 'personal', 'name': 'Personal', 'color': 'bg-gray-100 text-gray-800'}
    ]
    return {"categories": categories}

@api_router.get("/badges")
async def get_badges():
    """Get available badges"""
    return {"badges": BADGES}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
