from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import unquote
from pydantic import BaseModel
from googleapiclient.discovery import build
from dotenv import load_dotenv
from collections import Counter
from transformers import pipeline
from nltk.corpus import stopwords
import html
import nltk
import os
import re

# Download NLTK data
nltk.download('punkt')
nltk.download('stopwords')

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

# Load sentiment analysis model with truncation enabled
sentiment_model = pipeline("sentiment-analysis", truncation=True, max_length=512)

# ---------- Utility Functions ----------

def extract_video_id(url: str) -> str:
    """Extracts YouTube video ID using multiple formats."""
    url = url.strip()

    if "v=" in url:
        vid = url.split("v=", 1)[1][:11]
        if re.match(r"^[a-zA-Z0-9_-]{11}$", vid):
            return vid

    if "youtu.be/" in url:
        vid = url.split("youtu.be/", 1)[1][:11]
        if re.match(r"^[a-zA-Z0-9_-]{11}$", vid):
            return vid

    if "embed/" in url:
        vid = url.split("embed/", 1)[1][:11]
        if re.match(r"^[a-zA-Z0-9_-]{11}$", vid):
            return vid

    if "/shorts/" in url:
        vid = url.split("/shorts/", 1)[1][:11]
        if re.match(r"^[a-zA-Z0-9_-]{11}$", vid):
            return vid

    if re.match(r"^[a-zA-Z0-9_-]{11}$", url):
        return url

    return None

def clean_comment_text(text: str) -> str:
    """Clean HTML entities and tags from comment text."""
    if not text:
        return ""
    
    # Decode HTML entities (&#39; -> ', &amp; -> &, etc.)
    text = html.unescape(text)
    
    # Remove HTML tags but keep the content
    text = re.sub(r'<[^>]+>', '', text)
    
    # Clean up extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def truncate_text(text: str, max_chars: int = 500) -> str:
    """Truncate text to a reasonable length for sentiment analysis."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "..."

def analyze_sentiment(comments):
    """Returns sentiment percentages from a list of comment dicts."""
    if not comments:
        return {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0}
    
    # Truncate texts to avoid token limit issues
    texts = [truncate_text(c["text"]) for c in comments]
    
    try:
        results = sentiment_model(texts)
        counts = {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0}

        for r in results:
            label = r["label"].upper()
            if label not in counts:
                label = "NEUTRAL"
            counts[label] += 1

        total = len(comments) or 1
        for k in counts:
            counts[k] = round((counts[k] / total) * 100, 2)
        return counts
    
    except Exception as e:
        print(f"Sentiment analysis error: {e}")
        # Return neutral sentiment if analysis fails
        return {"POSITIVE": 33.33, "NEGATIVE": 33.33, "NEUTRAL": 33.34}

def average_length(comments):
    """Returns average comment length in characters."""
    if not comments:
        return 0
    total_chars = sum(len(c["text"]) for c in comments)
    return round(total_chars / len(comments), 2)

def extract_keywords(comments, top_n=10):
    """Extracts most common keywords from comments."""
    if not comments:
        return []
    
    try:
        stop_words = set(stopwords.words('english'))
        words = []
        for c in comments:
            tokens = re.findall(r'\b\w+\b', c["text"].lower())
            words.extend([w for w in tokens if w not in stop_words and len(w) > 2])
        return Counter(words).most_common(top_n)
    except Exception as e:
        print(f"Keyword extraction error: {e}")
        return []

def extract_questions(comments):
    """Extracts questions from comments based on keywords and question marks."""
    if not comments:
        return []
    
    questions = []
    question_keywords = ['why', 'how', 'what', 'when', 'where', 'who', 'which', 'whose', 'whom']
    
    try:
        for comment in comments:
            text = comment["text"].lower()
            sentences = re.split(r'[.!?]+', comment["text"])
            
            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue
                    
                # Check if sentence contains question mark
                has_question_mark = '?' in sentence
                
                # Check if sentence starts with question keywords
                sentence_lower = sentence.lower()
                starts_with_question_word = any(
                    sentence_lower.strip().startswith(keyword + ' ') or 
                    sentence_lower.strip().startswith(keyword + "'") 
                    for keyword in question_keywords
                )
                
                # Check if sentence contains question keywords
                contains_question_word = any(keyword in sentence_lower for keyword in question_keywords)
                
                # If it's likely a question, add it
                if has_question_mark or starts_with_question_word or (contains_question_word and len(sentence.split()) <= 20):
                    questions.append({
                        "text": sentence.strip(),
                        "author": comment["author"],
                        "likes": comment["likes"],
                        "published": comment["published"],
                        "original_comment": comment["text"]
                    })
        
        # Remove duplicates and sort by likes
        unique_questions = []
        seen_texts = set()
        
        for q in questions:
            if q["text"].lower() not in seen_texts and len(q["text"]) > 10:
                unique_questions.append(q)
                seen_texts.add(q["text"].lower())
        
        # Sort by likes (descending)
        unique_questions.sort(key=lambda x: x["likes"], reverse=True)
        
        return unique_questions
    
    except Exception as e:
        print(f"Question extraction error: {e}")
        return []

# ---------- API Endpoints ----------

@app.get("/comments")
def get_comments(video_id: str = Query(..., description="YouTube URL or video ID")):
    decoded_url = unquote(video_id)
    video_id_extracted = extract_video_id(decoded_url)

    if not video_id_extracted:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL or ID")

    return fetch_comments(video_id_extracted)

class VideoRequest(BaseModel):
    video_url: str

@app.post("/comments")
def get_comments_post(request: VideoRequest):
    video_id = extract_video_id(request.video_url)

    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL or ID")

    return fetch_comments(video_id)

@app.get("/comments/{video_id}")
def get_comments_by_id(video_id: str):
    if not re.match(r"^[a-zA-Z0-9_-]{11}$", video_id):
        raise HTTPException(status_code=400, detail="Invalid YouTube video ID format")

    return fetch_comments(video_id)

# ---------- Main Fetch Function ----------

def fetch_comments(video_id: str):
    if not YOUTUBE_API_KEY:
        return {"error": "YouTube API key not found in environment variables"}

    try:
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

        request = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=100,
            order="relevance"
        )

        response = request.execute()

        comments = []
        for item in response['items']:
            comment = item['snippet']['topLevelComment']['snippet']
            # Clean the comment text before storing
            clean_text = clean_comment_text(comment['textDisplay'])
            comments.append({
                "author": comment['authorDisplayName'],
                "text": clean_text,
                "likes": comment['likeCount'],
                "published": comment['publishedAt']
            })

        # Extract questions from comments
        questions = extract_questions(comments)

        return {
            "video_id": video_id,
            "status": "success",
            "comments": comments,
            "total_comments": len(comments),
            "questions": questions,
            "total_questions": len(questions),
            "analysis": {
                "sentiment": analyze_sentiment(comments),
                "average_length": average_length(comments),
                "top_keywords": extract_keywords(comments)
            }
        }

    except Exception as e:
        return {
            "video_id": video_id,
            "status": "error",
            "error": f"Failed to fetch comments: {str(e)}"
        }