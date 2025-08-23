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
from collections import Counter
import re

# load environment variables
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
        "https://knowyoufans.live",
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


# Aifuction

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

# API Routes 

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

def categorize_comments(comments):
    categories = {
        "Questions": [],
        "Requests": [],
        "Concerning": [],
        "Regular": []
    }

    for c in comments:
        text = c["text"].lower()

        if "?" in text or any(word in text for word in ["how", "what", "why", "when", "where"]):
            categories["Questions"].append(c)
        elif any(word in text for word in ["please", "can you", "could you", "request", "suggest"]):
            categories["Requests"].append(c)
        elif any(word in text for word in ["bad", "hate", "problem", "issue", "concern", "worry", "danger"]):
            categories["Concerning"].append(c)
        else:
            categories["Regular"].append(c)

    return categories

def fetch_comments(video_id: str, max_comments: int = 200):
    if not YOUTUBE_API_KEY:
        return {"status": "error", "error": "YouTube API key not found"}

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

        #  Try analyzing with Gemini 
        analysis = {}
        try:
            analysis = analyze_with_gemini(comments)
        except Exception as e:
            import traceback
            print("Gemini analysis failed:", e)
            print(traceback.format_exc())
            analysis = {
                "categories": {},
                "sentiment": {},
                "summary": "⚠️ Gemini analysis failed."
            }

        #  Categorization 
        if analysis.get("categories"):  # AI-based
            comments_by_category = {
                cat: [
                    c for i, c in enumerate(comments)
                    if str(i+1) in analysis.get("categories", {})
                    and analysis["categories"][str(i+1)] == cat
                ]
                for cat in ["Regular", "Questions", "Requests", "Concerning"]
            }
        else:  # Rule-based fallback
            comments_by_category = categorize_comments(comments)

        #  Keyword extraction 
        from collections import Counter
        import re
        all_text = " ".join(c["text"] for c in comments)
        words = re.findall(r"\b[a-zA-Z]{3,}\b", all_text.lower())
        stopwords = {
            "the","and","for","that","with","this","you","have","but","not","are",
            "was","from","they","your","just","what","all","about","can","will",
            "out","get","has","one","like"
        }
        filtered = [w for w in words if w not in stopwords]
        freq = Counter(filtered)
        top_keywords = freq.most_common(10)

        # fallback
        ai_summary = analysis.get("summary", "")
        if not ai_summary or "Error" in ai_summary or "⚠️" in ai_summary:
            if top_keywords:
                top_words = ", ".join([kw for kw, _ in top_keywords[:5]])
                ai_summary = (
                    f"Viewers are actively discussing topics like {top_words}. "
                    f"Engagement shows a mix of questions, requests, "
                    f"concerns, and regular feedback."
                )
            else:
                ai_summary = "Viewers are engaging with this video, leaving a mix of questions, feedback, and reactions."

        # Final return 
        return {
            "video_id": video_id,
            "total_comments": len(comments),
            "ai_summary": ai_summary,
            "comments_by_category": comments_by_category,
            "analysis": {
                "sentiment": analysis.get("sentiment", {}),
                "top_keywords": top_keywords
            },
            "raw_comments": comments
        }

    except Exception as e:
        import traceback
        print("Error:", e)
        print(traceback.format_exc())
        return {"status": "error", "error": f"Failed to fetch comments: {str(e)}"}
