
markdown
Copy
Edit
# YouTube Comment Section Summarizer

A web application that helps YouTube creators quickly understand what their audience is saying.  
It fetches comments from a given YouTube video and uses **Google Gemini 1.5 Flash** to summarize viewer sentiment, key topics, and feedback.

---

## 📌 Features
- **Frontend**: React + Vite-based interface for entering YouTube video URLs and viewing summaries.
- **Backend**: Python API to fetch comments and process summaries with Gemini AI.
- **Automatic Summarization**: Generates concise summaries of large comment sections.
- **Sentiment & Topic Extraction**: Identifies common themes and overall tone.
- **Scalable**: Works with videos containing hundreds or thousands of comments.

---

## 🛠 Tech Stack
### Frontend
- **React** (Vite)
- **Axios** for API requests
- **Tailwind CSS** *(if applicable)*

### Backend
- **Python** (FastAPI or Flask)
- **YouTube Data API v3**
- **Google Gemini 1.5 Flash API** for summarization

---

## 📂 Project Structure
├── backend/
│ ├── main.py # API endpoints
│ ├── requirements.txt # Backend dependencies
│ ├── .env # API keys (YouTube, Gemini)
│ └── ...
└── frontend/
├── src/App.jsx # Main React component
├── package.json # Frontend dependencies
└── ...

yaml
Copy
Edit

---

## 🚀 Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
2️⃣ Backend Setup
bash
Copy
Edit
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
Create a .env file:

env
Copy
Edit
YOUTUBE_API_KEY=your_youtube_api_key
GEMINI_API_KEY=your_gemini_api_key
Run the backend:

bash
Copy
Edit
uvicorn main:app --reload
3️⃣ Frontend Setup
bash
Copy
Edit
cd ../frontend
npm install
npm run dev
🔑 Environment Variables
In backend/.env:

env
Copy
Edit
YOUTUBE_API_KEY=your_youtube_api_key
GEMINI_API_KEY=your_gemini_api_key
⚙️ How It Works
User enters a YouTube video URL in the frontend.

Frontend sends the URL to the backend via an API request.

Backend uses the YouTube Data API v3 to fetch the video’s comments.

Gemini 1.5 Flash processes the comments and generates:

A summary of the discussion

Key points and repeated topics

Sentiment breakdown (positive/negative/neutral)

Backend sends the summary back to the frontend.

Frontend displays the result in an easy-to-read format.

scss
Copy
Edit
[ User ] 
   ↓
[ React + Vite Frontend ] 
   ↓ (API Request)
[ Python Backend ]
   ↓ (Fetch Comments)
[ YouTube Data API ]
   ↓ (Send to AI)
[ Gemini 1.5 Flash API ]
   ↓ (Return Summary)
[ Display in Frontend ]
🤝 Contributing
Fork the repo

Create a feature branch (git checkout -b feature-branch)

Commit your changes

Open a pull request

🙌 Thanks!
Thanks for checking out the project! Feel free to submit feedback or ideas for improvements.
