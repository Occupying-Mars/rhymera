import base64
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class BookGenerator:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_TOKEN")
        self.client = genai.Client(api_key=self.api_key)
        self.model = "gemini-2.0-flash"

    def generate_book(self, pages: int, book_type: str, topic: str, conversation_history: list = None):
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=f"""
                    Please create a {book_type} children's book about {topic} with {pages} pages.
                    """),
                ],
            ),
            types.Content(
                role="model",
                parts=[
                    types.Part.from_text(text=""" """),
                ],
            )
        ]

        # Add conversation history if provided
        if conversation_history:
            for entry in conversation_history:
                contents.append(entry)

        generate_content_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=genai.types.Schema(
                type = genai.types.Type.OBJECT,
                required = ["pages", "book_type", "book_content"],
                properties = {
                    "pages": genai.types.Schema(
                        type = genai.types.Type.INTEGER,
                        description = "Total number of pages in the book",
                    ),
                    "book_content": genai.types.Schema(
                        type = genai.types.Type.ARRAY,
                        items = genai.types.Schema(
                            type = genai.types.Type.OBJECT,
                            required = ["page", "content", "illustration"],
                            properties = {
                                "page": genai.types.Schema(
                                    type = genai.types.Type.INTEGER,
                                    description = "Page number",
                                ),
                                "content": genai.types.Schema(
                                    type = genai.types.Type.STRING,
                                    description = "Text content for the page",
                                ),
                                "illustration": genai.types.Schema(
                                    type = genai.types.Type.STRING,
                                    description = "Description of illustration for the page",
                                ),
                            },
                        ),
                    ),
                    "book_type": genai.types.Schema(
                        type = genai.types.Type.STRING,
                        description = "Type of children's book to generate",
                        enum = ["story", "poem", "nursery_rhyme", "propaganda", "educational"],
                    ),
                    "book_cover": genai.types.Schema(
                        type = genai.types.Type.STRING, 
                        description = "description of COVER OF the book, an illustration of what the book is about in book cover mode",
                    ),
                    "title_cover": genai.types.Schema(
                        type = genai.types.Type.STRING, 
                        description = "title COVER OF the book, an illustration of what the book is about in book cover mode",
                    ),
                },
            ),
            system_instruction=[
                types.Part.from_text(text="""your job is to generate a childrens book about the given topic from the user the user will give you the number of pages and the type of book you will generate it will be either of these types:
                1. a story book
                2. a poem
                3. a nursery rhyme
                4. propoganda mode (this is supposed to be satarical)
                5. educational mode (this is supposed to be detailed and trying to teach)
                """)
            ],
        )

        result = ""
        for chunk in self.client.models.generate_content_stream(
            model=self.model,
            contents=contents,
            config=generate_content_config,
        ):
            result += chunk.text

        return result

if __name__ == "__main__":
    # Example usage
    generator = BookGenerator()
    book = generator.generate_book(pages=5, book_type="story", topic="space exploration")
    # Save to JSON file
    with open('book_output.json', 'w') as f:
        f.write(book)
