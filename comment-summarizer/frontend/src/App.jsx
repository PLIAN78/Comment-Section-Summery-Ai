import { useState, useEffect } from "react";

function App() {
  const [videoId, setVideoId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchComments = async () => {
    if (!videoId.trim()) {
      setError("Please enter a YouTube URL or Video ID");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const encodedUrl = encodeURIComponent(videoId);
      const res = await fetch(`http://127.0.0.1:8000/comments?video_id=${encodedUrl}`);
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
      fetchComments();
    }
  };

  // Category metadata
  const getCategoryInfo = (category) => {
    const info = {
      Regular: { icon: "💬", color: "#28a745", label: "General Engagement" },
      Questions: { icon: "❓", color: "#007bff", label: "Audience Questions" },
      Requests: { icon: "🙋", color: "#ffc107", label: "Requests & Suggestions" },
      Concerning: { icon: "⚠️", color: "#dc3545", label: "Concerning Feedback" },
    };
    return info[category] || { icon: "📝", color: "#6c757d", label: "Other" };
  };

  // Format date
  const formatDate = (isoDate) => {
    return new Date(isoDate).toLocaleDateString();
  };

  // Reusable function to render small category cards
  const renderCategoryCard = (category) => {
    const { icon, color, label } = getCategoryInfo(category);
    const comments = data.comments_by_category?.[category] || [];
    const limitedComments = comments.slice(0, 8); // Show max 8

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
                <div className="comment-text" style={{ fontSize: '0.9rem' }}>
                  {comment.text.length > 100 ? comment.text.slice(0, 100) + '...' : comment.text}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#888', fontSize: '0.85rem', fontStyle: 'italic' }}>
              None
            </div>
          )}
          <div style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '8px', color: '#6c757d' }}>
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </div>
        </div>
      </div>
    );
  };

  // Auto-focus input on load
  useEffect(() => {
    document.getElementById("video-input")?.focus();
  }, []);

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
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            animation: fadeIn 0.5s ease-in;
          }

          .header {
            background: linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c);
            color: white;
            text-align: center;
            padding: 40px 20px;
            border-radius: 16px;
            margin-bottom: 30px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
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
          }

          .ai-summary {
            background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
            padding: 24px;
            border-radius: 16px;
            margin-bottom: 30px;
            border-left: 5px solid #1976d2;
            box-shadow: 0 4px 15px rgba(25, 118, 210, 0.15);
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

          .category-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid #eee;
            transition: transform 0.3s, box-shadow 0.3s;
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
          }

          .empty-state {
            text-align: center;
            padding: 80px 20px;
            background: white;
            border-radius: 16px;
            border: 2px dashed #ccc;
            color: #6c757d;
            margin-bottom: 30px;
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
        {error && (
          <div className="error">
            ⚠️ {error}
          </div>
        )}

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
            <h3>🤖 AI-Powered Summary</h3>
            <p>{data.ai_summary}</p>
          </div>
        )}

        {/* Category Grid - Enhanced Layout */}
        {data && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '20px',
            marginBottom: '30px',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            paddingBottom: '10px'
          }}>
            {/* 💬 Regular - General Engagement (Larger Card) */}
            {(() => {
              const category = "Regular";
              const { icon, color, label } = getCategoryInfo(category);
              const comments = data.comments_by_category?.[category] || [];

              return (
                <div key={category} className="category-card" style={{ minWidth: '400px' }}>
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
                      <div style={{ color: '#888', fontStyle: 'italic' }}>
                        No general engagement comments found.
                      </div>
                    )}
                    <div style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '10px', color: '#6c757d' }}>
                      {comments.length} total regular comments
                    </div>
                  </div>
                </div>
              );
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
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '25px',
            marginBottom: '30px',
            border: '1px solid #dee2e6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{
              color: '#1a2a6c',
              marginBottom: '16px',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🔍 Top Comment Topics & Keywords
            </h3>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              marginTop: '10px'
            }}>
              {data.analysis.top_keywords.map(([word, count], index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    border: '1px solid #bbdefb'
                  }}
                >
                  #{word} <span style={{ opacity: 0.7 }}>({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;