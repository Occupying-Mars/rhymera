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
    b64_json: Optional[str] = None

class BookContent(BaseModel):
    book_content: List[BookPage]
    book_type: str
    pages: int
    book_cover: Optional[str] = None
    title_cover: Optional[str] = None

class BookCreate(BaseModel):
    user_id: str
    title: str
    content: BookContent

class Book(BaseModel):
    id: str
    user_id: str
    title: str
    content: BookContent
    created_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 