from fastapi import FastAPI
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
print("Loaded API key:", YOUTUBE_API_KEY)  # Temporary debug
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

    # 🔹 Debug: Print full API response to terminal
    print("DEBUG: YouTube API raw response:", data)

    # If YouTube returns an error, send it back in the API response
    if "error" in data:
        return {"error": data["error"]}

    comments = [
        item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
        for item in data.get("items", [])
    ]
    return {"comments": comments}
