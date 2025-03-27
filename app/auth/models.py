from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None

class UserInDB(UserBase):
    hashed_password: str
    google_id: Optional[str] = None

class User(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    google_id: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class BookPage(BaseModel):
    page: int
    content: str
    illustration: str
    illustration_file: Optional[str] = None

class BookBase(BaseModel):
    pages: int
    book_type: str
    book_content: List[BookPage]

class BookCreate(BaseModel):
    user_id: str
    title: str
    content: Dict[str, Any]

class Book(BaseModel):
    id: str
    user_id: str
    title: str
    content: Dict[str, Any]

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 