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
