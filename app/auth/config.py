from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    # JWT settings
    SECRET_KEY: str = "your-secret-key-here"  # Replace with a secure secret key
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # MongoDB settings
    MONGODB_URL: str = "mongodb+srv://krishnas:2315@cluster0.8ezbsyu.mongodb.net/"
    DB_NAME: str = "rhymera"

    # Google OAuth settings
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # Google API settings
    GOOGLE_API_TOKEN: str = os.getenv("GOOGLE_API_TOKEN", "")

settings = Settings() 