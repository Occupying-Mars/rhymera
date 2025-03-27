import json
from datetime import timedelta
from typing import Annotated, List, Optional
from fastapi import FastAPI, HTTPException, Depends, status, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId
from google.oauth2 import id_token
from google.auth.transport import requests
import base64
from io import BytesIO
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from content import BookGenerator
from imagegen import ImageGenerator
from app.auth.models import UserCreate, User, Token, BookCreate, Book
from app.auth.utils import verify_password, get_password_hash, create_access_token, verify_token
from app.auth.database import users_collection
from app.auth.config import settings
from app.books import crud as book_crud
from app.books.pdf import generate_pdf
from app.books.images import save_image, get_image

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

class BookRequest(BaseModel):
    pages: int
    book_type: str
    topic: str

class BookGenerator(BookGenerator):
    def __init__(self):
        super().__init__()

class ImageGenerator(ImageGenerator):
    def __init__(self):
        super().__init__()

class GoogleLoginRequest(BaseModel):
    token: str  # This will be the user's Google ID (sub)
    email: str
    name: str = ""

async def get_current_user(token: Annotated[str | None, Depends(oauth2_scheme)]) -> Optional[User]:
    if token is None:
        return None
    
    try:
        token_data = verify_token(token)
        if token_data is None:
            return None
        
        user = users_collection.find_one({"username": token_data.username})
        if user is None:
            return None
        
        return User(
            id=str(user["_id"]),
            username=user["username"],
            email=user["email"],
            full_name=user.get("full_name"),
            google_id=user.get("google_id")
        )
    except:
        return None

@app.post("/register", response_model=User)
async def register(user: UserCreate):
    # Check if username already exists
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_dict = user.model_dump()
    del user_dict["password"]
    user_dict["hashed_password"] = hashed_password
    
    result = users_collection.insert_one(user_dict)
    
    return User(
        id=str(result.inserted_id),
        username=user.username,
        email=user.email,
        full_name=user.full_name
    )

@app.post("/google-login", response_model=Token)
async def google_login(request: GoogleLoginRequest):
    try:
        logger.info(f"Processing Google login for email: {request.email}")
        
        if not settings.GOOGLE_CLIENT_ID:
            logger.error("GOOGLE_CLIENT_ID is not set")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google authentication is not properly configured"
            )

        # Check if user exists
        user = users_collection.find_one({"google_id": request.token})
        
        if not user:
            logger.info(f"Creating new user for email: {request.email}")
            # Create new user
            username = request.email.split('@')[0]
            base_username = username
            counter = 1
            
            # Make sure username is unique
            while users_collection.find_one({"username": username}):
                username = f"{base_username}{counter}"
                counter += 1

            user_dict = {
                "username": username,
                "email": request.email,
                "full_name": request.name,
                "google_id": request.token,
                "hashed_password": get_password_hash(request.token[:32])  # Use part of token as password
            }
            
            result = users_collection.insert_one(user_dict)
            user_id = result.inserted_id
            logger.info(f"Created new user with ID: {user_id}")
        else:
            user_id = user["_id"]
            username = user["username"]
            logger.info(f"Found existing user with ID: {user_id}")

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": username},
            expires_delta=access_token_expires
        )
        
        logger.info(f"Generated access token for user: {username}")
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        logger.error(f"Unexpected error during Google login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during login: {str(e)}"
        )

@app.post("/token", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: Annotated[Optional[User], Depends(get_current_user)]):
    return current_user

@app.post("/generate-book")
async def generate_book(
    request: BookRequest,
    current_user: Annotated[Optional[User], Depends(get_current_user)]
):
    try:
        # Initialize generators
        book_gen = BookGenerator()
        img_gen = ImageGenerator()

        # Generate book content
        book_json = book_gen.generate_book(
            pages=request.pages,
            book_type=request.book_type,
            topic=request.topic
        )

        # Parse the book content
        book_data = json.loads(book_json)

        # Generate book cover first
        if "book_cover" in book_data:
            try:
                cover_images = img_gen.generate_image(
                    prompt=book_data["book_cover"],
                    style="book cover illustration, professional quality"
                )
                
                if cover_images and isinstance(cover_images, list) and len(cover_images) > 0:
                    cover_data = cover_images[0]
                    if "b64_json" in cover_data:
                        book_data["cover_b64_json"] = cover_data["b64_json"]
                        cover_bytes = base64.b64decode(cover_data["b64_json"])
                        cover_file_id = save_image(cover_bytes, "book_cover.png")
                        book_data["cover_file"] = cover_file_id
                    else:
                        logger.error("No b64_json in cover image data")
                        book_data["cover_file"] = None
                        book_data["cover_b64_json"] = None
                else:
                    logger.error("No cover images generated")
                    book_data["cover_file"] = None
                    book_data["cover_b64_json"] = None
            except Exception as e:
                logger.error(f"Error generating cover: {str(e)}")
                book_data["cover_file"] = None
                book_data["cover_b64_json"] = None

        # Generate illustrations for each page
        for page in book_data["book_content"]:
            # Generate image based on the illustration description
            images = img_gen.generate_image(
                prompt=page["illustration"],
                style="children's book illustration style"
            )
            
            if images and isinstance(images, list) and len(images) > 0:
                image_data = images[0]
                if "b64_json" in image_data:
                    # Store both base64 data and save to GridFS
                    page["b64_json"] = image_data["b64_json"]
                    image_bytes = base64.b64decode(image_data["b64_json"])
                    file_id = save_image(image_bytes, f"book_illustration_{page['page']}.png")
                    page["illustration_file"] = file_id
                else:
                    logger.error(f"No b64_json in image data: {image_data}")
                    page["illustration_file"] = None
                    page["b64_json"] = None
            else:
                logger.error("No images generated")
                page["illustration_file"] = None
                page["b64_json"] = None

        # Create book object
        book_create = BookCreate(
            user_id=current_user.id if current_user else "anonymous",
            title=book_data.get("title", "Untitled"),
            content=book_data
        )

        # Save the book to MongoDB
        saved_book = book_crud.create_book(book_create)
        book_data["saved_book_id"] = str(saved_book.id)

        # Return the final book content as a string
        return json.dumps(book_data, indent=2)

    except Exception as e:
        logger.error(f"Error generating book: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/books", response_model=Book)
async def create_book(
    book: BookCreate,
    current_user: Annotated[User, Depends(get_current_user)]
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to save books"
        )
    book.user_id = current_user.id
    return book_crud.create_book(book)

@app.get("/books", response_model=List[Book])
async def get_user_books(
    current_user: Annotated[User, Depends(get_current_user)],
    limit: int = 20,
    skip: int = 0
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view books"
        )
    return book_crud.get_user_books(current_user.id, limit=limit, skip=skip)

@app.get("/books/{book_id}")
async def get_book(
    book_id: str,
    current_user: Annotated[User, Depends(get_current_user)]
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view books"
        )
    book = book_crud.get_book(book_id, current_user.id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    return book

@app.get("/books/{book_id}/pdf")
async def download_pdf(
    book_id: str,
    current_user: Annotated[User, Depends(get_current_user)]
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to download PDF"
        )
    book = book_crud.get_book(book_id, current_user.id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    pdf_buffer = generate_pdf(book)
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="book-{book_id}.pdf"'
        }
    )

@app.get("/images/{file_id}")
async def get_image_by_id(file_id: str):
    result = get_image(file_id)
    if not result:
        raise HTTPException(status_code=404, detail="Image not found")
    
    image_data, filename = result
    return Response(
        content=image_data,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=31536000"
        }
    )