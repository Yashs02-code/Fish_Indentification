from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai
import os
import base64
import json
import logging

# -----------------------------
# Setup Logging
# -----------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------
# Load environment variables
# -----------------------------
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GEMINI_API_KEY)

# -----------------------------
# Initialize FastAPI
# -----------------------------
app = FastAPI(title="Fish Identification API")

# Allow CORS (frontend can call API easily)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Initialize Gemini Model
# -----------------------------
model = genai.GenerativeModel("gemini-1.5-flash")

# -----------------------------
# Fish Classification Function
# -----------------------------
def classify_fish_with_gemini(image_bytes: bytes):
    try:
        # Convert image to base64
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        # Prompt for Gemini
        prompt = """
You are an expert ichthyologist (fish expert).
Look at the provided image and classify the fish if present.

Return ONLY JSON in this format:

{
  "fish_type": "If fish found, name it. If none, return 'Unknown'",
  "description": "Short description of the fish OR why none detected",
  "habitat": "Likely habitat OR 'Unknown'",
  "edibility": "Edible/Not edible/Unknown"
}
"""

        # Generate response
        response = model.generate_content([
    prompt,
    {"mime_type": "image/jpeg", "data": image_base64}  # ✔ use base64
])


        result_text = response.text
        logger.info("Gemini Response: %s", result_text)

        # Parse JSON safely
        try:
            result_json = json.loads(result_text)
        except json.JSONDecodeError:
            result_json = {
                "fish_type": "Unknown",
                "description": result_text,
                "habitat": "Unknown",
                "edibility": "Unknown"
            }

        return result_json

    except Exception as e:
        logger.error("Error in classify_fish_with_gemini: %s", e)
        return {
            "fish_type": "Unknown",
            "description": f"Error: {str(e)}",
            "habitat": "Unknown",
            "edibility": "Unknown"
        }

# -----------------------------
# Fish Facts Function
# -----------------------------
def gemini_info(species: str):
    try:
        prompt = f"Write interesting facts about {species} fish."
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error("Error in gemini_info: %s", e)
        return f"Error: {str(e)}"

# -----------------------------
# API Endpoints
# -----------------------------
@app.post("/predict")
async def predict_fish(file: UploadFile = File(...)):
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPEG or PNG images are allowed")

    try:
        contents = await file.read()
        result = classify_fish_with_gemini(contents)
        return result
    except Exception as e:
        logger.error("Error in /predict endpoint: %s", e)
        return {
            "fish_type": "Unknown",
            "description": f"Error: {str(e)}",
            "habitat": "Unknown",
            "edibility": "Unknown"
        }

@app.get("/facts/{species}")
async def fish_facts(species: str):
    try:
        facts = gemini_info(species)
        return {"species": species, "facts": facts}
    except Exception as e:
        logger.error("Error in /facts endpoint: %s", e)
        return {"species": species, "facts": f"Error: {str(e)}"}
