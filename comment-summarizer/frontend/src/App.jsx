"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"

function App() {
  const [videoId, setVideoId] = useState("")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchComments = async () => {
  if (!videoId.trim()) {
    setError("Please enter a YouTube URL or Video ID");
    return;
  }

  setLoading(true);
  setError("");
  setData(null);

  try {
    const res = await fetch(`https://comment-section-summery-ai.onrender.com/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_url: videoId,  
        max_comments: 50
      }),
    });

    const responseData = await res.json();

    if (responseData.status === "error") {
      setError(responseData.error || "Failed to fetch comments");
    } else {
      setData(responseData);
    }
  } catch (err) {
    console.error("Error fetching comments:", err);
    setError("Network error. Make sure your backend is running.");
  } finally {
    setLoading(false);
  }
};


  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchComments()
    }
  }

  // Category metadata
  const getCategoryInfo = (category) => {
    const info = {
      Regular: {  color: "#28a745", label: "General Engagement" },
      Questions: { icon: "❓", color: "#007bff", label: "Audience Questions" },
      Requests: { icon: "🙋", color: "#ffc107", label: "Requests & Suggestions" },
      Concerning: { icon: "⚠️", color: "#dc3545", label: "Concerning Feedback" },
    }
    return info[category] || { icon: "📝", color: "#6c757d", label: "Other" }
  }

  // Format date
  const formatDate = (isoDate) => {
    return new Date(isoDate).toLocaleDateString()
  }

  // Reusable function to render small category cards
  const renderCategoryCard = (category) => {
    const { icon, color, label } = getCategoryInfo(category)
    const comments = data.comments_by_category?.[category] || []
    const limitedComments = comments.slice(0, 8) // Show max 8

    return (
      <div key={category} className="category-card">
        <div className="category-header" style={{ backgroundColor: color }}>
          {icon} {category}
          <span className="label">{label}</span>
        </div>
        <div className="category-body">
          {limitedComments.length > 0 ? (
            limitedComments.map((comment, idx) => (
              <div className="comment-item" key={idx}>
                <div className="comment-author">👤 {comment.author}</div>
                <div className="comment-meta">
                  <span>👍 {comment.likes}</span>
                </div>
                <div className="comment-text" style={{ fontSize: "0.9rem" }}>
                  {comment.text.length > 100 ? comment.text.slice(0, 100) + "..." : comment.text}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "#888", fontSize: "0.85rem", fontStyle: "italic" }}>None</div>
          )}
          <div style={{ textAlign: "center", fontSize: "0.85rem", marginTop: "8px", color: "#6c757d" }}>
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </div>
        </div>
      </div>
    )
  }

  // Auto-focus input on load
  useEffect(() => {
    document.getElementById("video-input")?.focus()
  }, [])

  return (
    <>
      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body, #root {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f7f9fc;
            color: #333;
            line-height: 1.6;
            width: 100%;
            overflow-x: hidden;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .container {
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            animation: fadeIn 0.5s ease-in;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
          }

          .header {
            background: linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c);
            color: white;
            text-align: center;
            padding: 40px 20px;
            border-radius: 16px;
            margin-bottom: 30px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            width: 100%;
            max-width: 1200px;
          }

          .header h1 {
            font-size: 2.8rem;
            font-weight: 700;
            margin: 0;
          }

          .header p {
            font-size: 1.2rem;
            margin-top: 10px;
            opacity: 0.9;
          }

          .input-section {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
            width: 100%;
            max-width: 1200px;
          }

          .input-section input {
            flex: 1;
            min-width: 300px;
            max-width: 500px;
            padding: 16px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 12px;
            outline: none;
            transition: border-color 0.3s;
          }

          .input-section input:focus {
            border-color: #1a2a6c;
            box-shadow: 0 0 0 3px rgba(26, 42, 108, 0.2);
          }

          .input-section button {
            padding: 16px 32px;
            font-size: 16px;
            font-weight: bold;
            color: white;
            background-color: #1a2a6c;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: background 0.3s, transform 0.2s;
            box-shadow: 0 4px 12px rgba(26, 42, 108, 0.3);
          }

          .input-section button:hover:not(:disabled) {
            background-color: #0d1b4a;
            transform: translateY(-2px);
          }

          .input-section button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
            transform: none;
          }

          .error {
            background-color: #f8d7da;
            color: #721c24;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #f5c6cb;
            margin-bottom: 24px;
            font-weight: 500;
            text-align: center;
            width: 100%;
            max-width: 1200px;
          }

          .ai-summary {
            background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
            padding: 24px;
            border-radius: 16px;
            margin-bottom: 30px;
            border-left: 5px solid #1976d2;
            box-shadow: 0 4px 15px rgba(25, 118, 210, 0.15);
            width: 100%;
            max-width: 1200px;
          }

          .ai-summary h3 {
            color: #1976d2;
            margin-top: 0;
            margin-bottom: 16px;
            font-size: 1.6rem;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .ai-summary p {
            font-size: 1.05rem;
            line-height: 1.7;
            color: #424242;
            white-space: pre-wrap;
          }

          .category-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            width: 100%;
            max-width: 1200px;
          }

          @media (max-width: 1200px) {
            .category-grid {
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
          }

          @media (max-width: 768px) {
            .category-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }
          }

          .category-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid #eee;
            transition: transform 0.3s, box-shadow 0.3s;
            min-width: 0; /* Prevents grid overflow */
          }

          .category-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          }

          .category-header {
            padding: 16px 20px;
            color: white;
            font-weight: 600;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .category-header .label {
            font-size: 0.95rem;
            opacity: 0.9;
            margin-left: auto;
          }

          .category-body {
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
          }

          .comment-item {
            padding: 14px;
            border-bottom: 1px solid #eee;
            font-size: 0.95rem;
            line-height: 1.5;
          }

          .comment-item:last-child {
            border-bottom: none;
          }

          .comment-author {
            font-weight: 600;
            color: #1a2a6c;
            font-size: 0.95rem;
          }

          .comment-meta {
            font-size: 0.8rem;
            color: #6c757d;
            margin: 4px 0 8px 0;
            display: flex;
            gap: 12px;
          }

          .comment-meta span {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .comment-text {
            color: #495057;
            word-wrap: break-word;
          }

          .empty-state {
            text-align: center;
            padding: 80px 20px;
            background: white;
            border-radius: 16px;
            border: 2px dashed #ccc;
            color: #6c757d;
            margin-bottom: 30px;
            width: 100%;
            max-width: 1200px;
          }

          .empty-state h3 {
            color: #1a2a6c;
            margin: 16px 0;
            font-size: 1.5rem;
          }

          .empty-state p {
            font-size: 1.1rem;
            color: #555;
          }

          .loading {
            text-align: center;
            padding: 50px;
            color: #1a2a6c;
            font-size: 1.2rem;
            width: 100%;
            max-width: 1200px;
          }

          .loading span {
            display: inline-block;
            animation: spin 1s linear infinite;
            margin-right: 10px;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .topics-section {
            background: white;
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid #dee2e6;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            width: 100%;
            max-width: 1200px;
          }

          .topics-section h3 {
            color: #1a2a6c;
            margin-bottom: 16px;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .topics-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
          }

          .topic-tag {
            background-color: #e3f2fd;
            color: #1976d2;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.95rem;
            font-weight: 500;
            border: 1px solid #bbdefb;
          }

          .topic-tag span {
            opacity: 0.7;
          }

          .about-section {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #dee2e6;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            width: 100%;
            max-width: 1200px;
          }

          .about-section h3 {
            color: #1a2a6c;
            margin-bottom: 20px;
            font-size: 1.8rem;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .about-section p {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #555;
            margin-bottom: 20px;
            text-align: left;
          }

          .about-section p:last-child {
            margin-bottom: 0;
          }

          .footer {
            background: linear-gradient(135deg, #1a2a6c, #2c3e50);
            color: white;
            padding: 30px 20px;
            border-radius: 16px 16px 0 0;
            margin-top: 40px;
            width: 100%;
            max-width: 1200px;
            text-align: center;
            box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.1);
          }

          .footer-content p {
            margin: 0;
            font-size: 1rem;
          }

          .footer-tagline {
            opacity: 0.8;
            font-style: italic;
            margin-top: 8px !important;
            font-size: 0.9rem !important;
          }
        `}
      </style>

      <div className="container">
        {/* Header */}
        <div className="header">
          <h1>KnowYouFans</h1>
          <h2>YouTube Comment Analyzer</h2>
          <p>AI-powered insights • Smart categorization • Actionable feedback</p>
        </div>

        {/* Input */}
        <div className="input-section">
          <input
            id="video-input"
            type="text"
            placeholder="Enter YouTube URL or Video ID"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={fetchComments} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* Error */}
        {error && <div className="error">⚠️ {error}</div>}

        {/* Loading */}
        {loading && (
          <div className="loading">
            <span>🔄</span> Fetching and analyzing comments with AI...
          </div>
        )}

        {/* Empty State */}
        {!loading && !data && !error && (
          <div className="empty-state">
            <div style={{ fontSize: "4rem" }}>🎥</div>
            <h3>Ready to Analyze</h3>
            <p>Enter a YouTube video link to get AI-powered insights on audience sentiment, questions, and feedback.</p>
          </div>
        )}

        {/* AI Summary */}
        {data?.ai_summary && (
          <div className="ai-summary">
            <h3> AI-Powered Summary Gemini 1.5 Flash</h3>
            <p>{data.ai_summary}</p>
          </div>
        )}

        {/* Category Grid - Fixed Layout */}
        {data && (
          <div className="category-grid">
            {/*  Regular - General Engagement (Larger Card) */}
            {(() => {
              const category = "Regular"
              const { icon, color, label } = getCategoryInfo(category)
              const comments = data.comments_by_category?.[category] || []

              return (
                <div key={category} className="category-card">
                  <div className="category-header" style={{ backgroundColor: color }}>
                    {icon} {category}
                    <span className="label">{label}</span>
                  </div>
                  <div className="category-body">
                    {comments.length > 0 ? (
                      comments.map((comment, idx) => (
                        <div className="comment-item" key={idx}>
                          <div className="comment-author">👤 {comment.author}</div>
                          <div className="comment-meta">
                            <span>👍 {comment.likes}</span>
                            <span>📅 {formatDate(comment.published)}</span>
                          </div>
                          <div className="comment-text">{comment.text}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "#888", fontStyle: "italic" }}>No general engagement comments found.</div>
                    )}
                    <div style={{ textAlign: "center", fontSize: "0.9rem", marginTop: "10px", color: "#6c757d" }}>
                      {comments.length} total regular comments
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ❓ Questions */}
            {renderCategoryCard("Questions")}

            {/* 🙋 Requests */}
            {renderCategoryCard("Requests")}

            {/* ⚠️ Concerning */}
            {renderCategoryCard("Concerning")}
          </div>
        )}

        {/* Top Topics Section */}
        {data?.analysis?.top_keywords && data.analysis.top_keywords.length > 0 && (
          <div className="topics-section">
            <h3>🔍 Top Comment Topics & Keywords</h3>
            <div className="topics-tags">
              {data.analysis.top_keywords.map(([word, count], index) => (
                <span key={index} className="topic-tag">
                  #{word} <span>({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
          {/* Audience Sentiment Section */}
{data?.analysis?.sentiment && Object.keys(data.analysis.sentiment).length > 0 && (
  <div className="topics-section">
    <h3>📊 Audience Sentiment</h3>
    <PieChart width={400} height={300}>
      <Pie
        data={Object.entries(data.analysis.sentiment).map(([key, value]) => ({
          name: key,
          value: value,
        }))}
        cx="50%"
        cy="50%"
        outerRadius={100}
        dataKey="value"
        label
      >
        {Object.entries(data.analysis.sentiment).map(([key], index) => (
          <Cell
            key={`cell-${index}`}
            fill={
              key === "Positive"
                ? "#28a745" // green
                : key === "Negative"
                ? "#dc3545" // red
                : "#ffc107" // yellow for Neutral
            }
          />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </div>
)}
        {/* Fallback: show raw comments if no categories available */}
{data?.raw_comments && (!data.comments_by_category || 
  Object.values(data.comments_by_category).every(arr => arr.length === 0)) && (
  <div className="topics-section">
    <h3> All Comments (Uncategorized)</h3>
    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
      {data.raw_comments.map((comment, idx) => (
        <div key={idx} className="comment-item">
          <div className="comment-author">👤 {comment.author}</div>
          <div className="comment-meta">
            <span> {comment.likes}</span>
            <span> {new Date(comment.published).toLocaleDateString()}</span>
          </div>
          <div className="comment-text">{comment.text}</div>
        </div>
      ))}
    </div>
  </div>
)}

        {/* About Section */}
        <div className="about-section">
          <h3> Our Mission</h3>
          <p>
            As a creator <a href="https://peterlian.com">myself</a>, I've witnessed countless talented individuals struggle to truly understand and connect with their audiences. 
            The gap between content creators and their communities often leads to missed opportunities, decreased engagement, and ultimately, 
            creators feeling disconnected from the very people they're trying to serve.
          </p>
          <p>
            KnowYouFans was born from this personal experience and observation. I realized that while creators pour their hearts into content, 
            they often lack the tools to deeply understand what their audience truly thinks, wants, and needs. Traditional analytics tell us 
            the "what" but not the "why" behind audience behavior.
          </p>
          <p>
            This YouTube comment analyzer is just the beginning. Our vision extends far beyond a single platform – we're building towards 
            comprehensive audience intelligence across TikTok, WeChat, Instagram, and all major social platforms. YouTube serves as our 
            proving ground, the first door we're opening in a much larger ecosystem of creator-audience understanding.
          </p>
          <p>
            Every creator deserves to know their fans. Every audience deserves to be truly heard. KnowYouFans bridges that gap with 
            AI-powered insights that transform raw comments into actionable intelligence, helping creators build stronger, more meaningful 
            connections with their communities.
          </p>
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <p>© 2025 KnowYouFans. All rights reserved.</p>
            <p className="footer-tagline">Empowering creators to truly know their audiences.</p>
          </div>
        </footer>
      </div>
    </>
  )
}

export default App