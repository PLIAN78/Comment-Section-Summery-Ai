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
import google.generativeai as genai
import json
from typing import List, Dict

# Download NLTK data
nltk.download('punkt')
nltk.download('stopwords')

# load environment variables
load_dotenv()

app = FastAPI()

# Get API keys from environment
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Initialize Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# Load sentiment analysis model with truncation enabled
sentiment_model = pipeline(
    "sentiment-analysis",
    model="distilbert/distilbert-base-uncased-finetuned-sst-2-english",
    revision="714eb0f",
    truncation=True,
    max_length=512
)

# Gemini Comment Categorization 

def categorize_comments_with_gemini(comments: List[Dict], batch_size: int = 25) -> List[Dict]:

    if not GEMINI_API_KEY:
        print("Gemini API key not found. Falling back to basic categorization.")
        return categorize_comments_basic(comments)
    
    if not comments:
        return comments
    
    categorized_comments = []
    
    # Process comments in batches to manage API costs and rate limits
    for i in range(0, len(comments), batch_size):
        batch = comments[i:i + batch_size]
        try:
            batch_results = categorize_batch_with_gemini(batch)
            categorized_comments.extend(batch_results)
            print(f"Processed batch {i//batch_size + 1}/{(len(comments) + batch_size - 1)//batch_size}")
        except Exception as e:
            print(f"Error categorizing batch {i//batch_size + 1}: {e}")
            # Fall back to basic categorization for this batch
            basic_batch = categorize_comments_basic(batch)
            categorized_comments.extend(basic_batch)
    
    return categorized_comments

def categorize_batch_with_gemini(comments_batch: List[Dict]) -> List[Dict]:
    """Categorize a batch of comments using Gemini"""
    
    # Prepare the prompt with all comments in the batch
    comments_text = ""
    for i, comment in enumerate(comments_batch):
        # Truncate very long comments to save tokens
        text = comment['text'][:300] + "..." if len(comment['text']) > 300 else comment['text']
        comments_text += f"{i+1}. \"{text}\"\n"
    
    prompt = f"""

{comments_text}

**Instructions:**
- Respond with ONLY a JSON object
- Format: {{"1": "Regular", "2": "Questions", "3": "Requests", "4": "Concerning"}}
- Each number (1-{len(comments_batch)}) corresponds to a comment
- Use exactly these category names: Regular, Questions, Requests, Concerning
- Be consistent and precise in categorization

JSON Response:
"""

    try:
        response = gemini_model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Parse the JSON response
        categories = parse_gemini_response(result_text, len(comments_batch))
        
        # Apply categories to comments
        for i, comment in enumerate(comments_batch):
            category = categories.get(str(i + 1), "Regular")  # Default to Regular if parsing fails
            comment["category"] = category
            
        return comments_batch
        
    except Exception as e:
        print(f"Gemini API error: {e}")
        raise e

def parse_gemini_response(response_text: str, expected_count: int) -> Dict[str, str]:
    
    categories = {}
    valid_categories = {"Regular", "Questions", "Requests", "Concerning"}
    
    try:
        # Clean the response text to extract JSON
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        
        if json_start != -1 and json_end != -1:
            json_text = response_text[json_start:json_end]
            parsed = json.loads(json_text)
            
            # Validate and clean the parsed data
            for key, value in parsed.items():
                if isinstance(key, (str, int)) and value in valid_categories:
                    categories[str(key)] = value
        
        # Fill in missing categories with "Regular"
        for i in range(1, expected_count + 1):
            if str(i) not in categories:
                categories[str(i)] = "Regular"
                
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Response text: {response_text}")
        # Try alternative parsing methods
        categories = parse_gemini_fallback(response_text, expected_count)
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        # Default all to Regular if parsing fails
        for i in range(1, expected_count + 1):
            categories[str(i)] = "Regular"
    
    return categories

def parse_gemini_fallback(response_text: str, expected_count: int) -> Dict[str, str]:
    categories = {}
    valid_categories = {"Regular", "Questions", "Requests", "Concerning"}
    
    try:
       
        import re
        patterns = [
            r'"?(\d+)"?\s*:\s*"(\w+)"',  
            r'(\d+):\s*(\w+)',          
            r'(\d+)\.\s*(\w+)',          
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, response_text)
            for match in matches:
                index = str(match[0])
                category = match[1]
                if category in valid_categories and 1 <= int(index) <= expected_count:
                    categories[index] = category
            
            if len(categories) >= expected_count * 0.5:  
                break
        
        # Fill in missing categories
        for i in range(1, expected_count + 1):
            if str(i) not in categories:
                categories[str(i)] = "Regular"
                
    except Exception as e:
        print(f"Fallback parsing error: {e}")
        # Default all to Regular
        for i in range(1, expected_count + 1):
            categories[str(i)] = "Regular"
    
    return categories

def categorize_comments_basic(comments: List[Dict]) -> List[Dict]:
    """Basic fallback categorization using keyword matching"""
    question_keywords = ['why', 'how', 'what', 'when', 'where', 'who', 'which', 'whose', 'whom', '?']
    request_keywords = ['please', 'can you', 'could you', 'would you', 'make a video', 'do a', 'collab', 'suggestion', 'request']
    concerning_keywords = ['hate', 'stupid', 'sucks', 'terrible', 'awful', 'worst', 'delete', 'unsubscribe', 'reported']
    
    for comment in comments:
        text_lower = comment['text'].lower()
        
        # Check for questions
        if any(keyword in text_lower for keyword in question_keywords):
            comment["category"] = "Questions"
        # Check for requests
        elif any(keyword in text_lower for keyword in request_keywords):
            comment["category"] = "Requests"
        # Check for concerning content
        elif any(keyword in text_lower for keyword in concerning_keywords):
            comment["category"] = "Concerning"
        else:
            comment["category"] = "Regular"
    
    return comments

def generate_category_summary(categorized_comments: List[Dict]) -> Dict:
    #Generate summary statistics for categorized comments
    category_counts = {"Regular": 0, "Questions": 0, "Requests": 0, "Concerning": 0}
    category_examples = {"Regular": [], "Questions": [], "Requests": [], "Concerning": []}
    
    for comment in categorized_comments:
        category = comment.get("category", "Regular")
        category_counts[category] += 1
        
        # Store top examples (by likes) for each category
        if len(category_examples[category]) < 3:
            category_examples[category].append({
                "text": comment["text"][:100] + "..." if len(comment["text"]) > 100 else comment["text"],
                "author": comment["author"],
                "likes": comment["likes"]
            })
    
    total = len(categorized_comments) if categorized_comments else 1
    category_percentages = {k: round((v / total) * 100, 2) for k, v in category_counts.items()}
    
    return {
        "counts": category_counts,
        "percentages": category_percentages,
        "examples": category_examples,
        "total_analyzed": total
    }

# AI Summary Generation 

def generate_ai_summary(categorized_comments: List[Dict], category_summary: Dict) -> str:
   
    if not GEMINI_API_KEY:
        return generate_basic_summary(category_summary)
    
    if not categorized_comments:
        return "No comments available for analysis."
    
    try:
        # Prepare sample comments from each category for context
        samples = {}
        for category in ["Regular", "Questions", "Requests", "Concerning"]:
            category_comments = [c for c in categorized_comments if c.get("category") == category]
            if category_comments:
                # Get top 3 most liked comments from this category
                sorted_comments = sorted(category_comments, key=lambda x: x.get("likes", 0), reverse=True)
                samples[category] = [
                    c["text"][:150] + "..." if len(c["text"]) > 150 else c["text"] 
                    for c in sorted_comments[:3]
                ]
        
        # Create the prompt
        prompt = f"""
You are analyzing a YouTube video's comment section. Here's the data:

**Comment Statistics:**
- Total comments analyzed: {category_summary['total_analyzed']}
- Regular comments: {category_summary['counts']['Regular']} ({category_summary['percentages']['Regular']}%)
- Questions: {category_summary['counts']['Questions']} ({category_summary['percentages']['Questions']}%)
- Requests/Suggestions: {category_summary['counts']['Requests']} ({category_summary['percentages']['Requests']}%)
- Concerning comments: {category_summary['counts']['Concerning']} ({category_summary['percentages']['Concerning']}%)

**Sample Comments by Category:**
{format_sample_comments(samples)}

**Instructions:**
Write a comprehensive 2-3 paragraph summary for the content creator about their comment section. Include:
1. Overall engagement quality and audience sentiment
2. Key themes, questions, and requests from viewers
3. Areas of concern or opportunities for improvement
4. Actionable insights for the creator

Keep the tone professional but friendly, and focus on actionable insights.
"""

        response = gemini_model.generate_content(prompt)
        return response.text.strip()
        
    except Exception as e:
        print(f"Error generating AI summary: {e}")
        return generate_basic_summary(category_summary)

def generate_basic_summary(category_summary: Dict) -> str:
    """Generate a basic summary without Gemini"""
    summary = f"""
Basic Comment Analysis Summary:
- Total comments analyzed: {category_summary['total_analyzed']}
- Regular comments: {category_summary['counts']['Regular']} ({category_summary['percentages']['Regular']}%)
- Questions: {category_summary['counts']['Questions']} ({category_summary['percentages']['Questions']}%)
- Requests: {category_summary['counts']['Requests']} ({category_summary['percentages']['Requests']}%)
- Concerning comments: {category_summary['counts']['Concerning']} ({category_summary['percentages']['Concerning']}%)

For detailed insights, please ensure you have a valid Gemini API key configured.
"""
    return summary.strip()

def format_sample_comments(samples: Dict) -> str:
    #Format sample comments for the prompt
    formatted = ""
    for category, comments in samples.items():
        if comments:
            formatted += f"\n{category} Comments:\n"
            for i, comment in enumerate(comments, 1):
                formatted += f"  {i}. \"{comment}\"\n"
    return formatted

# Utility Function

def extract_video_id(url: str) -> str:
    #Extracts YouTube video ID using multiple formats.
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
    if not text:
        return ""
    
    text = html.unescape(text)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def truncate_text(text: str, max_chars: int = 500) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "..."

def analyze_sentiment(comments):
    """Returns sentiment percentages from a list of comment dicts."""
    if not comments:
        return {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0}
    
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
        return {"POSITIVE": 33.33, "NEGATIVE": 33.33, "NEUTRAL": 33.34}

def average_length(comments):
    """Returns average comment length in characters."""
    if not comments:
        return 0
    total_chars = sum(len(c["text"]) for c in comments)
    return round(total_chars / len(comments), 2)

def extract_keywords(comments, top_n=15):
    """Extract meaningful keywords/topics from comments."""
    if not comments:
        return []
    
    try:
        stop_words = set(stopwords.words('english'))
        # Add common YouTube filler words
        extra_stops = {
            'like', 'get', 'just', 'know', 'really', 'think', 'going', 'want',
            'see', 'would', 'could', 'make', 'good', 'great', 'one', 'new',
            'much', 'many', 'also', 'still', 'even', 'back', 'yes', 'no'
        }
        stop_words.update(extra_stops)
        
        words = []
        for c in comments:
            tokens = re.findall(r'\b[a-zA-Z]{3,}\b', c["text"].lower())  # Only words >2 letters
            words.extend([w for w in tokens if w not in stop_words])
        
        return Counter(words).most_common(top_n)
    except Exception as e:
        print(f"Keyword extraction error: {e}")
        return []    
   

# API Endpoints 

@app.get("/comments")
def get_comments(
    video_id: str = Query(..., description="YouTube URL or video ID"),
    max_comments: int = Query(500, description="Maximum number of comments to fetch (default: 500)"),
    use_gemini: bool = Query(True, description="Use Gemini for advanced categorization (default: True)")
):
    decoded_url = unquote(video_id)
    video_id_extracted = extract_video_id(decoded_url)

    if not video_id_extracted:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL or ID")

    if max_comments < 1:
        raise HTTPException(status_code=400, detail="max_comments must be at least 1")
    
    if max_comments > 2000:
        raise HTTPException(status_code=400, detail="max_comments cannot exceed 2000")

    return fetch_comments(video_id_extracted, max_comments, use_gemini)

class VideoRequest(BaseModel):
    video_url: str
    max_comments: int = 500
    use_gemini: bool = True

@app.post("/comments")
def get_comments_post(request: VideoRequest):
    video_id = extract_video_id(request.video_url)

    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL or ID")

    if request.max_comments < 1:
        raise HTTPException(status_code=400, detail="max_comments must be at least 1")
    
    if request.max_comments > 2000:
        raise HTTPException(status_code=400, detail="max_comments cannot exceed 2000")

    return fetch_comments(video_id, request.max_comments, request.use_gemini)

@app.get("/comments/{video_id}")
def get_comments_by_id(
    video_id: str,
    max_comments: int = Query(500, description="Maximum number of comments to fetch (default: 500)"),
    use_gemini: bool = Query(True, description="Use Gemini for advanced categorization (default: True)")
):
    if not re.match(r"^[a-zA-Z0-9_-]{11}$", video_id):
        raise HTTPException(status_code=400, detail="Invalid YouTube video ID format")

    if max_comments < 1:
        raise HTTPException(status_code=400, detail="max_comments must be at least 1")
    
    if max_comments > 2000:
        raise HTTPException(status_code=400, detail="max_comments cannot exceed 2000")

    return fetch_comments(video_id, max_comments, use_gemini)

#  Main Fetch Function 

def fetch_comments(video_id: str, max_comments: int = 500, use_gemini: bool = True):
    """Fetch YouTube comments with pagination and Gemini categorization"""
    if not YOUTUBE_API_KEY:
        return {"error": "YouTube API key not found in environment variables"}

    try:
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

        comments = []
        next_page_token = None
        requests_made = 0
        max_requests = (max_comments // 100) + 1

        print(f"Starting to fetch up to {max_comments} comments for video {video_id}")

        while True:
            try:
                request = youtube.commentThreads().list(
                    part="snippet",
                    videoId=video_id,
                    maxResults=100,
                    order="relevance",
                    pageToken=next_page_token
                )

                response = request.execute()
                requests_made += 1
                print(f"API request {requests_made} completed. Fetched {len(response['items'])} comments.")

                for item in response['items']:
                    comment = item['snippet']['topLevelComment']['snippet']
                    clean_text = clean_comment_text(comment['textDisplay'])
                    comments.append({
                        "author": comment['authorDisplayName'],
                        "text": clean_text,
                        "likes": comment['likeCount'],
                        "published": comment['publishedAt']
                    })

                    if max_comments and len(comments) >= max_comments:
                        break

                next_page_token = response.get('nextPageToken')
                
                if not next_page_token or (max_comments and len(comments) >= max_comments) or requests_made >= max_requests:
                    break

            except Exception as page_error:
                print(f"Error fetching page {requests_made}: {page_error}")
                break

        if max_comments and len(comments) > max_comments:
            comments = comments[:max_comments]

        print(f"Fetched {len(comments)} comments using {requests_made} API requests")

        # Categorize comments
        if use_gemini and GEMINI_API_KEY:
            print("Starting Gemini categorization...")
            categorized_comments = categorize_comments_with_gemini(comments)
            print("Gemini categorization completed")
        else:
            print("Using basic categorization...")
            categorized_comments = categorize_comments_basic(comments)

        # Generate category summary
        category_summary = generate_category_summary(categorized_comments)

        # Generate AI summary
        print("Generating AI summary...")
        ai_summary = generate_ai_summary(categorized_comments, category_summary)
        print("AI summary generated")

        # Separate comments by category for easier frontend handling
        comments_by_category = {
            "Regular": [c for c in categorized_comments if c.get("category") == "Regular"],
            "Questions": [c for c in categorized_comments if c.get("category") == "Questions"],
            "Requests": [c for c in categorized_comments if c.get("category") == "Requests"],
            "Concerning": [c for c in categorized_comments if c.get("category") == "Concerning"]
        }

        return {
            "video_id": video_id,
            "status": "success",
            "comments": categorized_comments,
            "comments_by_category": comments_by_category,
            "total_comments": len(categorized_comments),
            "requests_made": requests_made,
            "categorization_used": "gemini" if (use_gemini and GEMINI_API_KEY) else "basic",
            "category_summary": category_summary,
            "ai_summary": ai_summary,
            "analysis": {
                "sentiment": analyze_sentiment(categorized_comments),
                "average_length": average_length(categorized_comments),
                "top_keywords": extract_keywords(categorized_comments)
            }
        }

    except Exception as e:
        return {
            "video_id": video_id,
            "status": "error",
            "error": f"Failed to fetch comments: {str(e)}"
        }