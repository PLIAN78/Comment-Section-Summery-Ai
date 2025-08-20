from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import unquote
from pydantic import BaseModel
from googleapiclient.discovery import build
from dotenv import load_dotenv
import html
import os
import re
import google.generativeai as genai
import json
from typing import List, Dict

# Load environment variables
load_dotenv()

app = FastAPI()

# Get API keys from environment
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://plian78.github.io",
        "https://comment-section-summery-ai.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# ---------------- Utility Functions ---------------- #

def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from various formats"""
    url = url.strip()

    patterns = [
        (r"v=([a-zA-Z0-9_-]{11})", 1),
        (r"youtu\.be/([a-zA-Z0-9_-]{11})", 1),
        (r"embed/([a-zA-Z0-9_-]{11})", 1),
        (r"/shorts/([a-zA-Z0-9_-]{11})", 1),
    ]

    for pattern, group in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(group)

    if re.match(r"^[a-zA-Z0-9_-]{11}$", url):
        return url

    return None


def clean_comment_text(text: str) -> str:
    if not text:
        return ""
    text = html.unescape(text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ---------------- AI Functions ---------------- #

def analyze_with_gemini(comments: List[Dict]) -> Dict:
    """Send comments to Gemini for categorization + sentiment + summary"""

    if not comments:
        return {
            "categories": {},
            "sentiment": {},
            "summary": "No comments available for analysis.",
        }

    # Prepare prompt
    comments_text = "\n".join(
        [f"{i+1}. \"{c['text']}\"" for i, c in enumerate(comments[:50])]
    )

    prompt = f"""
You are analyzing a YouTube video's comment section.

Here are some sample comments:
{comments_text}

Tasks:
1. Categorize each comment into one of: Regular, Questions, Requests, Concerning.
2. Give an overall sentiment breakdown (Positive, Negative, Neutral) with percentages.
3. Write a 2–3 paragraph summary for the content creator including:
   - Overall engagement quality and audience sentiment
   - Key themes, questions, and requests from viewers
   - Areas of concern or opportunities for improvement
   - Actionable insights
Respond ONLY in JSON format:
{{
  "categories": {{"1": "Regular", "2": "Questions", ... }},
  "sentiment": {{"Positive": 0, "Negative": 0, "Neutral": 0}},
  "summary": "..."
}}
"""

    try:
        response = gemini_model.generate_content(prompt)
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"Gemini error: {e}")
        return {
            "categories": {},
            "sentiment": {},
            "summary": "Error generating analysis with Gemini.",
        }

# ---------------- API Routes ---------------- #

class VideoRequest(BaseModel):
    video_url: str
    max_comments: int = 200


@app.post("/comments")
def get_comments_post(request: VideoRequest):
    video_id = extract_video_id(request.video_url)

    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL or ID")

    if request.max_comments < 1 or request.max_comments > 2000:
        raise HTTPException(status_code=400, detail="max_comments must be 1–2000")

    return fetch_comments(video_id, request.max_comments)


def fetch_comments(video_id: str, max_comments: int = 200):
    """Fetch YouTube comments with pagination and analyze with Gemini"""

    if not YOUTUBE_API_KEY:
        return {"error": "YouTube API key not found"}

    try:
        youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

        comments = []
        next_page_token = None

        while len(comments) < max_comments:
            request = youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=100,
                order="relevance",
                pageToken=next_page_token,
            )
            response = request.execute()

            for item in response["items"]:
                comment = item["snippet"]["topLevelComment"]["snippet"]
                clean_text = clean_comment_text(comment["textDisplay"])
                comments.append(
                    {
                        "author": comment["authorDisplayName"],
                        "text": clean_text,
                        "likes": comment["likeCount"],
                        "published": comment["publishedAt"],
                    }
                )

                if len(comments) >= max_comments:
                    break

            next_page_token = response.get("nextPageToken")
            if not next_page_token:
                break

        # Analyze with Gemini
        analysis = analyze_with_gemini(comments)

        return {
            "video_id": video_id,
            "total_comments": len(comments),
            "comments": comments,
            "analysis": analysis,
        }

    except Exception as e:
        return {"error": f"Failed to fetch comments: {str(e)}"}
