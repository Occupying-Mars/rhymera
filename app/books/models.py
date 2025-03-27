from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId

class BookPage(BaseModel):
    page_number: int
    content: str
    illustration_prompt: str
    illustration_file_id: Optional[str] = None
    illustration_b64: Optional[str] = None

class BookMetadata(BaseModel):
    title: str
    description: Optional[str] = None
    author_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    book_type: str
    topic: str
    cover_prompt: Optional[str] = None
    cover_file_id: Optional[str] = None
    cover_b64: Optional[str] = None
    status: str = "draft"  # draft, generating, completed, error
    total_pages: int

class Book(BaseModel):
    id: str = Field(alias="_id")
    metadata: BookMetadata
    pages: List[BookPage]
    raw_content: Optional[Dict[str, Any]] = None  # Store raw generated content

class BookCreateRequest(BaseModel):
    pages: int
    book_type: str
    topic: str

class BookResponse(BaseModel):
    id: str
    metadata: BookMetadata
    pages: List[BookPage] 