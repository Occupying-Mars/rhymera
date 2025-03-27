import base64
import os
import mimetypes
from google import genai
from google.genai import types
from app.auth.config import settings

class ImageGenerator:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GOOGLE_API_TOKEN)
        self.model = "gemini-2.0-flash-exp-image-generation"
        
    def generate_image(self, prompt: str, style: str = "early 2000 comic art style") -> list:
        """Generate an image based on the prompt"""
        try:
            # Initialize contents with system instruction
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text="""Please generate images based on the given prompts.
                        Follow these guidelines:
                        - Generate square images (1024x1024 pixels)
                        - Do not include any text in the images
                        - Focus on visual representation only
                        - Use the specified art style
                        """),
                    ],
                ),
            ]

            # Add current prompt
            contents.append(
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=f"""Please generate an image with the following details:
                        Style: {style}
                        Prompt: {prompt}
                        Remember: NO TEXT in the image, just visual representation."""),
                    ],
                )
            )

            generate_content_config = types.GenerateContentConfig(
                response_modalities=["image", "text"],
                response_mime_type="text/plain",
            )

            result_images = []
            for chunk in self.client.models.generate_content_stream(
                model=self.model,
                contents=contents,
                config=generate_content_config,
            ):
                if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
                    continue
                
                if chunk.candidates[0].content.parts[0].inline_data:
                    inline_data = chunk.candidates[0].content.parts[0].inline_data
                    result_images.append({
                        'b64_json': base64.b64encode(inline_data.data).decode('utf-8')
                    })
                    break  # We only need one image
            
            return result_images
            
        except Exception as e:
            print(f"Error generating image: {str(e)}")
            return []

if __name__ == "__main__":
    # Example usage
    generator = ImageGenerator()
    images = generator.generate_image(
        prompt="A cat chasing a butterfly in a garden",
        style="black and white manga style"
    )
