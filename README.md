
# YouTube Comment Section Summarizer

A web application that helps YouTube creators quickly understand what their audience is saying.
It fetches comments from a given YouTube video and uses **Google Gemini 1.5 Flash** to summarize viewer sentiment, key topics, and feedback.

---

##  Features

* **Frontend:** React + Vite interface for entering YouTube video URLs and viewing summaries.
* **Backend:** Python API that fetches comments and processes summaries with Gemini AI.
* **Automatic Summarization:** Generates concise overviews of large comment sections.
* **Sentiment & Topic Extraction:** Identifies common themes and overall tone.
* **Scalable:** Works with videos containing hundreds or thousands of comments.

---

## 🛠 Tech Stack

**Frontend**

* React (Vite)
* Axios for API requests
* Tailwind CSS *(optional)*

**Backend**

* Python (FastAPI or Flask)
* YouTube Data API v3
* Google Gemini 1.5 Flash API

---

##  Project Structure

```
├── backend/
│   ├── main.py             # API endpoints
│   ├── requirements.txt    # Backend dependencies
│   ├── .env                 # API keys (YouTube, Gemini)
│   └── ...
└── frontend/
    ├── src/App.jsx         # Main React component
    ├── package.json        # Frontend dependencies
    └── ...
```

---

##  Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```env
YOUTUBE_API_KEY=your_youtube_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Run the backend:

```bash
uvicorn main:app --reload
```

### 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

---

## ⚙️ How It Works

1. User enters a YouTube video URL in the frontend.
2. Frontend sends the URL to the backend via an API request.
3. Backend uses the YouTube Data API v3 to fetch the video’s comments.
4. Gemini 1.5 Flash processes the comments and generates:

   * A summary of the discussion
   * Key points and repeated topics
   * Sentiment breakdown (positive / negative / neutral)
5. Backend sends the summary back to the frontend.
6. Frontend displays the result in an easy-to-read format.

**Workflow Diagram:**

```
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
```

---

##  Contributing

1. Fork the repo
2. Create a feature branch:

   ```bash
   git checkout -b feature-branch
   ```
3. Commit your changes
4. Open a pull request

---

##  Thanks

Thanks for checking out the project!
Feel free to submit feedback or ideas for improvements. Peter.L(2025/8/11)



