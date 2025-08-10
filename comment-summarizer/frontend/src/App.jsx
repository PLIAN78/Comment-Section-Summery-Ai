import { useState } from "react";

function App() {
  const [videoId, setVideoId] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchComments = async () => {
    if (!videoId.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    setLoading(true);
    setError("");
    setComments([]);

    try {
      // URL encode the video URL to handle special characters
      const encodedUrl = encodeURIComponent(videoId);
      const res = await fetch(`http://127.0.0.1:8000/comments?video_id=${encodedUrl}`);
      const data = await res.json();
      
      console.log("API response:", data);

      if (data.status === "error") {
        setError(data.error || "Failed to fetch comments");
      } else {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Network error. Make sure your backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchComments();
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>YouTube Comment Fetcher</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter YouTube Video URL (e.g., https://www.youtube.com/watch?v=...)"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            width: "70%",
            padding: "10px",
            marginRight: "10px",
            fontSize: "14px"
          }}
        />
        <button 
          onClick={fetchComments}
          disabled={loading}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Loading..." : "Fetch Comments"}
        </button>
      </div>

      {error && (
        <div style={{
          color: "red",
          backgroundColor: "#ffe6e6",
          padding: "10px",
          borderRadius: "4px",
          marginBottom: "20px"
        }}>
          Error: {error}
        </div>
      )}

      <div>
        {loading && <p>Fetching comments...</p>}
        
        {comments.length > 0 && (
          <div>
            <h3>Comments ({comments.length}):</h3>
            <div style={{ maxHeight: "600px", overflowY: "auto" }}>
              {comments.map((comment, index) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "15px",
                    marginBottom: "10px",
                    backgroundColor: "#f9f9f9"
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px"
                  }}>
                    <strong style={{ color: "#333" }}>{comment.author}</strong>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      👍 {comment.likes} | {new Date(comment.published).toLocaleDateString()}
                    </div>
                  </div>
                  <p style={{
                    margin: "0",
                    lineHeight: "1.4",
                    color: "#555"
                  }}>
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && comments.length === 0 && !error && (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            No comments loaded yet. Enter a YouTube URL and click "Fetch Comments".
          </p>
        )}
      </div>
    </div>
  );
}

export default App;