from datetime import datetime
from bson import ObjectId
from typing import List
from app.auth.database import db
from app.auth.models import Book, BookCreate
import logging

logger = logging.getLogger(__name__)
books_collection = db["books"]

# Create index on user_id for faster queries
try:
    books_collection.create_index("user_id")
    books_collection.create_index([("created_at", -1)])
except Exception as e:
    logger.error(f"Error creating index: {e}")

async def create_book(book: BookCreate) -> Book:
    book_dict = book.model_dump()
    book_dict["created_at"] = datetime.utcnow()
    result = await books_collection.insert_one(book_dict)
    book_dict["id"] = str(result.inserted_id)
    return Book(**book_dict)

async def get_user_books(user_id: str, limit: int = 20, skip: int = 0) -> List[Book]:
    try:
        # Only get books belonging to the user, sorted by creation date
        cursor = books_collection.find(
            {"user_id": user_id},
            sort=[("created_at", -1)],
            limit=limit,
            skip=skip
        )
        books = []
        async for book in cursor:
            book["id"] = str(book["_id"])
            books.append(Book(**book))
        return books
    except Exception as e:
        logger.error(f"Error fetching user books: {e}")
        return []

async def get_book(book_id: str, user_id: str) -> Book | None:
    try:
        book = await books_collection.find_one({
            "_id": ObjectId(book_id),
            "user_id": user_id  # Only get books owned by the user
        })
        if book:
            book["id"] = str(book["_id"])
            return Book(**book)
        return None
    except Exception as e:
        logger.error(f"Error fetching book: {e}")
        return None 