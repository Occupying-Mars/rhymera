from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO
import base64
from PIL import Image as PILImage
from .images import get_image
import logging

logger = logging.getLogger(__name__)

def create_image_from_bytes(image_bytes: bytes) -> str:
    """Create a temporary image file from bytes and return its path"""
    try:
        # Create a PIL Image from bytes
        img = PILImage.open(BytesIO(image_bytes))
        
        # Create a temporary buffer
        temp_buffer = BytesIO()
        
        # Save the image to the buffer in PNG format
        img.save(temp_buffer, format='PNG')
        
        # Return the buffer
        return temp_buffer.getvalue()
    except Exception as e:
        logger.error(f"Error creating image from bytes: {str(e)}")
        return None

async def generate_pdf(book_data: dict) -> BytesIO:
    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []

        # Define styles
        styles = getSampleStyleSheet()
        heading_style = styles['Heading1']
        body_style = styles['BodyText']

        # Add title
        title = book_data.get('title', 'Untitled Book')
        story.append(Paragraph(title, heading_style))
        story.append(Spacer(1, 12))

        # Add each page
        for page in book_data.get('book_content', []):
            # Add page number
            story.append(Paragraph(f"Page {page.get('page', '?')}", heading_style))
            story.append(Spacer(1, 12))
            
            # Add content
            story.append(Paragraph(page.get('content', ''), body_style))
            story.append(Spacer(1, 12))
            
            image_data = None
            
            # Try to get image from base64 first
            if page.get('b64_json'):
                try:
                    image_data = base64.b64decode(page['b64_json'])
                except Exception as e:
                    logger.error(f"Error decoding base64 image: {str(e)}")
            
            # If no base64, try MongoDB
            if not image_data and page.get('illustration_file'):
                try:
                    result = await get_image(page['illustration_file'])
                    if result:
                        image_data = result[0]
                except Exception as e:
                    logger.error(f"Error getting image from MongoDB: {str(e)}")
            
            # Add illustration if we have image data
            if image_data:
                try:
                    # Create a temporary image
                    temp_image = create_image_from_bytes(image_data)
                    if temp_image:
                        img = Image(BytesIO(temp_image), width=6*inch, height=4*inch)
                        story.append(img)
                        story.append(Spacer(1, 12))
                except Exception as e:
                    logger.error(f"Error adding image to PDF: {str(e)}")

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        raise 