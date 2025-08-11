YouTube Comment Section Summarizer
A web application that helps YouTube creators quickly understand what their audience is saying.
It fetches comments from a given YouTube video and uses Google Gemini 1.5 Flash to summarize viewer sentiment, key topics, and feedback.

📌 Features
Frontend: React + Vite-based interface for entering YouTube video URLs and viewing summaries.

Backend: Python API to fetch comments and process summaries with Gemini AI.

Automatic Summarization: Generates concise summaries of large comment sections.

Sentiment & Topic Extraction: Identifies common themes and overall tone.

Scalable: Works with videos containing hundreds or thousands of comments.

🛠 Tech Stack
Frontend
React (Vite)

Axios for API requests

Tailwind CSS (if applicable)

Backend
Python (FastAPI or Flask)

YouTube Data API v3

Google Gemini 1.5 Flash API for summarization
