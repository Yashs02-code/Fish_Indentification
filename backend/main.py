from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai
import os
import base64
import json
import re

# Load environment variables
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_json(text: str):
    """
    Extract JSON object from Gemini response, even if it's wrapped in ```json ... ```
    """
    try:
        # Try direct JSON parse
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to extract content between ```json ... ```
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    # Fallback if nothing works
    return {
        "fish_type": "Unknown",
        "description": text.strip(),
        "habitat": "Unknown",
        "edibility": "Unknown",
    }


def classify_fish_with_gemini(image_bytes: bytes):
    try:
        # Initialize Gemini model
        model = genai.GenerativeModel("gemini-1.5-flash")

        # Prompt
        prompt = """
You are an expert ichthyologist (fish expert).
Classify the fish in the image and return ONLY JSON in this format:

{
  "fish_type": "...",
  "description": "...",
  "habitat": "...",
  "edibility": "..."
}
"""

        # Send image + prompt
        response = model.generate_content([
            prompt,
            {"mime_type": "image/jpeg", "data": image_bytes}
        ])

        result_text = response.text or ""
        print("Gemini Response:", result_text)

        # Ensure clean JSON
        result_json = extract_json(result_text)

        # Make sure required keys exist
        return {
            "fish_type": result_json.get("fish_type", "Unknown"),
            "description": result_json.get("description", "No description available."),
            "habitat": result_json.get("habitat", "Unknown"),
            "edibility": result_json.get("edibility", "Unknown")
        }

    except Exception as e:
        print("Error in classify_fish_with_gemini:", e)
        return {
            "fish_type": "Unknown",
            "description": f"Error: {str(e)}",
            "habitat": "Unknown",
            "edibility": "Unknown"
        }


@app.post("/predict")
async def predict_fish(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = classify_fish_with_gemini(contents)
        return result
    except Exception as e:
        print("Error in /predict endpoint:", e)
        return {
            "fish_type": "Unknown",
            "description": f"Error: {str(e)}",
            "habitat": "Unknown",
            "edibility": "Unknown"
        }
