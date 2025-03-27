from pymongo import MongoClient
from .config import settings

client = MongoClient(settings.MONGODB_URL)
db = client[settings.DB_NAME]

# Collections
users_collection = db["users"]
books_collection = db["books"]

# Create indexes for the users collection
users_collection.create_index("username", unique=True)
users_collection.create_index("email", unique=True)
users_collection.create_index("google_id", sparse=True)

# Create indexes for the books collection
books_collection.create_index([("user_id", 1), ("created_at", -1)]) 