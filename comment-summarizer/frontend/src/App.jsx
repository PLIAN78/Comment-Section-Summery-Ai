import { useState } from "react";

function App() {
  const [videoId, setVideoId] = useState("");
  const [comments, setComments] = useState([]);

  const fetchComments = async () => {
    if (!videoId) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/comments?video_id=${videoId}`);
      const data = await res.json();
      console.log("API response:", data);

      setComments(data.comments || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>YouTube Comment Fetcher</h1>
      <input
        type="text"
        placeholder="Enter YouTube Video ID"
        value={videoId}
        onChange={(e) => setVideoId(e.target.value)}
      />
      <button onClick={fetchComments}>Fetch Comments</button>

      <ul>
        {comments.length > 0 ? (
          comments.map((c, i) => <li key={i}>{c}</li>)
        ) : (
          <p>No comments loaded yet.</p>
        )}
      </ul>
    </div>
  );
}

export default App;
