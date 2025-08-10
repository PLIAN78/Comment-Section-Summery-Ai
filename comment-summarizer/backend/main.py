from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import unquote
from pydantic import BaseModel
from googleapiclient.discovery import build
from dotenv import load_dotenv
import os
import re

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get YouTube API key from environment
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')

# Option 1: Use Query parameter with proper URL decoding
@app.get("/comments")
def get_comments(video_id: str = Query(..., description="YouTube URL or video ID")):
    # URL decode the parameter
    decoded_url = unquote(video_id)
    video_id_extracted = extract_video_id(decoded_url)
    
    if not video_id_extracted:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL or ID")
    
    return fetch_comments(video_id_extracted)

# Option 2: Use POST with request body (recommended for URLs)
class VideoRequest(BaseModel):
    video_url: str

@app.post("/comments")
def get_comments_post(request: VideoRequest):
    video_id = extract_video_id(request.video_url)
    
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL or ID")
    
    return fetch_comments(video_id)

# Option 3: Use path parameter for video ID only
@app.get("/comments/{video_id}")
def get_comments_by_id(video_id: str):
    # Validate video ID format
    if not re.match(r"^[a-zA-Z0-9_-]{11}$", video_id):
        raise HTTPException(status_code=400, detail="Invalid YouTube video ID format")
    
    return fetch_comments(video_id)

def extract_video_id(url: str) -> str:
    """Extracts YouTube video ID using the v= parameter approach."""
    url = url.strip()
    
    # Method 1: Look for v= parameter (most common)
    if "v=" in url:
        # Get everything after "v=" and take first 11 characters
        video_id = url.split("v=", 1)[1][:11]
        
        # Validate it's a proper YouTube ID format
        if re.match(r"^[a-zA-Z0-9_-]{11}$", video_id):
            return video_id
    
    # Method 2: Handle youtu.be format
    if "youtu.be/" in url:
        # Get everything after "youtu.be/" and take first 11 characters
        video_id = url.split("youtu.be/", 1)[1][:11]
        if re.match(r"^[a-zA-Z0-9_-]{11}$", video_id):
            return video_id
    
    # Method 3: Handle embed URLs
    if "embed/" in url:
        video_id = url.split("embed/", 1)[1][:11]
        if re.match(r"^[a-zA-Z0-9_-]{11}$", video_id):
            return video_id
    
    # Method 4: Handle YouTube Shorts
    if "/shorts/" in url:
        video_id = url.split("/shorts/", 1)[1][:11]
        if re.match(r"^[a-zA-Z0-9_-]{11}$", video_id):
            return video_id
    
    # Method 5: Check if it's already just a video ID
    if re.match(r"^[a-zA-Z0-9_-]{11}$", url):
        return url
    
    return None

# Real YouTube API function
def fetch_comments(video_id: str):
    if not YOUTUBE_API_KEY:
        return {"error": "YouTube API key not found in environment variables"}
    
    try:
        # Build YouTube API client
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        
        # Request comments from YouTube API
        request = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=100,
            order="relevance"
        )
        
        response = request.execute()
        
        # Parse comments from response
        comments = []
        for item in response['items']:
            comment = item['snippet']['topLevelComment']['snippet']
            comments.append({
                "author": comment['authorDisplayName'],
                "text": comment['textDisplay'],
                "likes": comment['likeCount'],
                "published": comment['publishedAt']
            })
        
        return {
            "video_id": video_id,
            "status": "success",
            "comments": comments,
            "total_comments": len(comments)
        }
        
    except Exception as e:
        return {
            "video_id": video_id,
            "status": "error",
            "error": f"Failed to fetch comments: {str(e)}"
        }