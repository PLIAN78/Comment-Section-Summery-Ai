from fastapi import FastAPI
import requests
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

# ✅ Enable CORS globally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:3000"] for specific frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
print("Loaded API key:", YOUTUBE_API_KEY)  # Debugging

@app.get("/comments")
def get_comments(video_id: str):
    url = "https://www.googleapis.com/youtube/v3/commentThreads"
    params = {
        "part": "snippet",
        "videoId": video_id,
        "maxResults": 20,
        "textFormat": "plainText",
        "key": YOUTUBE_API_KEY
    }
    
    res = requests.get(url, params=params)
    data = res.json()

    # Debug full YouTube API response
    print("DEBUG: YouTube API raw response:", data)

    if "error" in data:
        return {"error": data["error"]}

    comments = [
        item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
        for item in data.get("items", [])
    ]
    return {"comments": comments}
