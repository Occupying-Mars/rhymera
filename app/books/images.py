from typing import Optional, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from app.auth.database import db
import io

# Initialize AsyncIOMotorGridFS
fs = AsyncIOMotorGridFSBucket(db)

async def save_image(image_bytes: bytes, filename: str) -> str:
    """Save an image to GridFS and return its ID"""
    file_id = await fs.upload_from_stream(filename, image_bytes)
    return str(file_id)

async def get_image(file_id: str) -> Optional[Tuple[bytes, str]]:
    """Retrieve an image from GridFS by its ID"""
    try:
        file_id_obj = ObjectId(file_id)
        grid_out = await fs.open_download_stream(file_id_obj)
        contents = await grid_out.read()
        return contents, grid_out.filename
    except:
        return None

async def delete_image(file_id: str) -> bool:
    """Delete an image from GridFS"""
    try:
        file_id_obj = ObjectId(file_id)
        await fs.delete(file_id_obj)
        return True
    except:
        return False 