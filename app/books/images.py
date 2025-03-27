from typing import Optional, Tuple
from bson import ObjectId
from gridfs import GridFS
from app.auth.database import db
import io

# Initialize GridFS
fs = GridFS(db)

def save_image(image_bytes: bytes, filename: str) -> str:
    """Save an image to GridFS and return its ID"""
    file_id = fs.put(image_bytes, filename=filename)
    return str(file_id)

def get_image(file_id: str) -> Optional[Tuple[bytes, str]]:
    """Retrieve an image from GridFS by its ID"""
    try:
        file_id_obj = ObjectId(file_id)
        grid_out = fs.get(file_id_obj)
        return grid_out.read(), grid_out.filename
    except:
        return None

def delete_image(file_id: str) -> bool:
    """Delete an image from GridFS"""
    try:
        file_id_obj = ObjectId(file_id)
        fs.delete(file_id_obj)
        return True
    except:
        return False 