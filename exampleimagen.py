import base64
import os
import mimetypes
from google import genai
from google.genai import types


def save_binary_file(file_name, data):
    f = open(file_name, "wb")
    f.write(data)
    f.close()


def generate():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-2.0-flash-exp-image-generation"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="""can you please generate an image for each of the pages from these nursery rhymes
just the images no need to add text to it i repeat NO TEXT in the images just generate a visualization of the text i have given so if it says the dog goes to the park then it should show a dog on the way to a park and just that do it in a square image ratio of 1024 x 1024 pixels and make it look good 
do it early 2000 comic art style (and no text remember)
here is the page 1
\"\"\"
(Page 1: Illustration - Two kids, Larry and Sergey, sitting in front of a computer piled high with books.)

Yo! Lemme tell ya 'bout a tale so cool,
'Bout two smart dudes who ruled in school!
Larry and Sergey, brains so bright,
Dreamin' big ideas, day and night!
\"\"\""""),
            ],
        ),
        types.Content(
            role="model",
            parts=[
                types.Part.from_bytes(
                    mime_type="""image/png""",
                    data=base64.b64decode(
                      """iVBORw0KGgoAAAANSUhEUgAABAAAAAQACAIAAADwf7zUAAAgAElEQVR4nIT9WZNl2XUmiK1h73POHX0OD485IqfIeUAmkBgIgGCRFIcqstilqmZ3kVXdVq3uMklmMpP0B2Qm05teZDKTmaRWtYnFLrJJVnMECYIYE0ACyAk5REZmxjx5+Ox+hzPtvdbSwz6eqDdFDhZxPfz6uefsvfZa3/q+fEAWskRhFn4QuwflXY48XaiWqyTdXEUaxJAtbum4kjEc6v9IqoavTdjOqVBIUzhYyHT+5aaoSiPkL0jBTrJaYVDuNU8Di2qdhUPu3s+96SQqTVfSWpiZR4u+2Vut9hDSBTpvpv8PWq6h0bWb+ywAAAAASUVORK5CYII="""
                    ),
                ),
            ],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="""INSERT_INPUT_HERE"""),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        response_modalities=[
            "image",
            "text",
        ],
        response_mime_type="text/plain",
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
            continue
        if chunk.candidates[0].content.parts[0].inline_data:
            file_name = "ENTER_FILE_NAME"
            inline_data = chunk.candidates[0].content.parts[0].inline_data
            file_extension = mimetypes.guess_extension(inline_data.mime_type)
            save_binary_file(
                f"{file_name}{file_extension}", inline_data.data
            )
            print(
                "File of mime type"
                f" {inline_data.mime_type} saved"
                f"to: {file_name}"
            )
        else:
            print(chunk.text)

if __name__ == "__main__":
    generate()
