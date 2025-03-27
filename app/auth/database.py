from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DB_NAME]

# Collections
users_collection = db["users"]
books_collection = db["books"]

# Create indexes for the users collection
async def init_indexes():
    await users_collection.create_index("username", unique=True)
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("google_id", sparse=True)
    await books_collection.create_index([("user_id", 1), ("created_at", -1)]) 