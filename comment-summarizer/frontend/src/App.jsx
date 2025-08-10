import { useState } from "react";

function App() {
  const [videoId, setVideoId] = useState("");
  const [comments, setComments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchComments = async () => {
    if (!videoId.trim()) {
      setError("Please enter a YouTube URL or Video ID");
      return;
    }

    setLoading(true);
    setError("");
    setComments([]);
    setQuestions([]);
    setAnalysis(null);

    try {
      const encodedUrl = encodeURIComponent(videoId);
      const res = await fetch(`http://127.0.0.1:8000/comments?video_id=${encodedUrl}`);
      const data = await res.json();

      console.log("API response:", data);

      if (data.status === "error") {
        setError(data.error || "Failed to fetch comments");
      } else {
        setComments(data.comments || []);
        setQuestions(data.questions || []);
        setAnalysis(data.analysis || null);
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

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#ffffff", 
      padding: "20px", 
      maxWidth: "1400px", 
      margin: "0 auto",
      fontFamily: "Arial, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #dc3545, #c82333)",
        color: "white",
        padding: "30px",
        borderRadius: "12px",
        marginBottom: "30px",
        boxShadow: "0 4px 15px rgba(220, 53, 69, 0.3)"
      }}>
        <h1 style={{ 
          margin: "0", 
          fontSize: "2.5rem", 
          fontWeight: "bold",
          textAlign: "center"
        }}>
          YouTube Comment Analyzer
        </h1>
        <p style={{ 
          margin: "10px 0 0 0", 
          textAlign: "center", 
          opacity: "0.9",
          fontSize: "1.1rem"
        }}>
          Analyze sentiment, extract questions, and discover insights from YouTube comments
        </p>
      </div>

      {/* Input Section */}
      <div style={{ 
        marginBottom: "30px", 
        textAlign: "center",
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        border: "2px solid #fee2e2"
      }}>
        <input
          type="text"
          placeholder="Enter YouTube URL or Video ID"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            width: "60%",
            padding: "15px",
            marginRight: "15px",
            fontSize: "16px",
            border: "2px solid #dc3545",
            borderRadius: "8px",
            outline: "none",
            transition: "border-color 0.3s ease"
          }}
          onFocus={(e) => e.target.style.borderColor = "#c82333"}
          onBlur={(e) => e.target.style.borderColor = "#dc3545"}
        />
        <button
          onClick={fetchComments}
          disabled={loading}
          style={{
            padding: "15px 30px",
            fontSize: "16px",
            backgroundColor: loading ? "#6c757d" : "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            transition: "all 0.3s ease",
            boxShadow: loading ? "none" : "0 2px 8px rgba(220, 53, 69, 0.3)"
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#c82333";
              e.target.style.transform = "translateY(-2px)";
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#dc3545";
              e.target.style.transform = "translateY(0px)";
            }
          }}
        >
          {loading ? "🔄 Analyzing..." : "🔍 Analyze Comments"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            color: "#dc3545",
            backgroundColor: "#f8d7da",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #f5c6cb",
            fontWeight: "500"
          }}
        >
          ⚠️ Error: {error}
        </div>
      )}

      {/* Analysis Summary */}
      {analysis && (
        <div
          style={{
            marginBottom: "30px",
            background: "linear-gradient(135deg, #ffffff, #f8f9fa)",
            padding: "25px",
            borderRadius: "12px",
            border: "2px solid #dc3545",
            boxShadow: "0 4px 15px rgba(220, 53, 69, 0.1)"
          }}
        >
          <h3 style={{ 
            color: "#dc3545", 
            marginTop: "0", 
            fontSize: "1.5rem",
            borderBottom: "2px solid #fee2e2",
            paddingBottom: "10px"
          }}>
             Comment Analysis Summary
          </h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
            gap: "20px",
            marginTop: "20px"
          }}>
            <div style={{ 
              padding: "15px", 
              backgroundColor: "#ffffff", 
              borderRadius: "8px",
              border: "1px solid #fee2e2"
            }}>
              <strong style={{ color: "#dc3545" }}>📏 Average Length:</strong>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#495057" }}>
                {analysis.average_length} characters
              </div>
            </div>
            <div style={{ 
              padding: "15px", 
              backgroundColor: "#ffffff", 
              borderRadius: "8px",
              border: "1px solid #fee2e2"
            }}>
              <strong style={{ color: "#dc3545" }}> Sentiment Analysis:</strong>
              <div style={{ marginTop: "8px",color:"black"}}>
                <div>😀 Positive: <strong>{analysis.sentiment.POSITIVE}%</strong></div>
                <div>😐 Neutral: <strong>{analysis.sentiment.NEUTRAL}%</strong></div>
                <div>😡 Negative: <strong>{analysis.sentiment.NEGATIVE}%</strong></div>
              </div>
            </div>
            <div style={{ 
              padding: "15px", 
              backgroundColor: "#ffffff", 
              borderRadius: "8px",
              border: "1px solid #fee2e2"
            }}>
              <strong style={{ color: "#dc3545" }}>🔑 Top Keywords:</strong>
              <div style={{ marginTop: "8px", fontSize: "14px" }}>
                {analysis.top_keywords.length > 0 ? (
                  analysis.top_keywords
                    .slice(0, 5)
                    .map((k) => (
                      <span key={k[0]} style={{
                        display: "inline-block",
                        backgroundColor: "#dc3545",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        margin: "2px",
                        fontWeight: "500"
                      }}>
                        {k[0]} ({k[1]})
                      </span>
                    ))
                ) : (
                  <span style={{ color: "#6c757d" }}>No keywords found</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div style={{ 
          textAlign: "center", 
          padding: "40px",
          color: "#dc3545",
          fontSize: "1.2rem"
        }}>
          <div style={{ 
            display: "inline-block",
            animation: "spin 1s linear infinite",
            fontSize: "2rem",
            marginBottom: "10px"
          }}>
            🔄
          </div>
          <div>Fetching and analyzing comments...</div>
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

      {/* Main content area with two columns */}
      <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
        {/* Left side - Comments */}
        <div style={{ flex: "2" }}>
          {comments.length > 0 && (
            <div>
              <h3 style={{ 
                color: "#dc3545", 
                borderBottom: "2px solid #fee2e2",
                paddingBottom: "10px"
              }}>
                💬 Comments ({comments.length})
              </h3>
              <div style={{ maxHeight: "700px", overflowY: "auto" }}>
                {comments.map((comment, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #fee2e2",
                      borderRadius: "12px",
                      padding: "20px",
                      marginBottom: "15px",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 2px 8px rgba(220, 53, 69, 0.1)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 15px rgba(220, 53, 69, 0.2)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "translateY(0px)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(220, 53, 69, 0.1)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                        alignItems: "center"
                      }}
                    >
                      <strong style={{ 
                        color: "#dc3545", 
                        fontSize: "1rem",
                        fontWeight: "600"
                      }}>
                        👤 {comment.author}
                      </strong>
                      <div style={{ 
                        fontSize: "12px", 
                        color: "#6c757d",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                      }}>
                        <span style={{ 
                          backgroundColor: "#dc3545", 
                          color: "white", 
                          padding: "2px 8px", 
                          borderRadius: "12px",
                          fontWeight: "500"
                        }}>
                          👍 {comment.likes}
                        </span>
                        <span>
                          📅 {new Date(comment.published).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p style={{ 
                      margin: "0", 
                      color: "#495057", 
                      lineHeight: "1.5",
                      fontSize: "15px"
                    }}>
                      {comment.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side - Questions */}
        {questions.length > 0 && (
          <div style={{ flex: "1", minWidth: "350px" }}>
            <div
              style={{
                position: "sticky",
                top: "20px",
                background: "linear-gradient(135deg, #ffffff, #f8f9fa)",
                border: "2px solid #dc3545",
                borderRadius: "12px",
                padding: "20px",
                maxHeight: "700px",
                overflowY: "auto",
                boxShadow: "0 4px 15px rgba(220, 53, 69, 0.2)"
              }}
            >
              <h3 style={{ 
                margin: "0 0 20px 0", 
                color: "#dc3545",
                fontSize: "1.3rem",
                borderBottom: "2px solid #fee2e2",
                paddingBottom: "10px"
              }}>
                ❓ Questions Found ({questions.length})
              </h3>
              <div>
                {questions.map((question, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #fee2e2",
                      borderRadius: "8px",
                      padding: "15px",
                      marginBottom: "12px",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 1px 5px rgba(220, 53, 69, 0.1)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "#dc3545";
                      e.currentTarget.style.boxShadow = "0 2px 10px rgba(220, 53, 69, 0.2)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "#fee2e2";
                      e.currentTarget.style.boxShadow = "0 1px 5px rgba(220, 53, 69, 0.1)";
                    }}
                  >
                    <p style={{
                      margin: "0 0 10px 0",
                      color: "#495057",
                      fontWeight: "500",
                      lineHeight: "1.4",
                      fontSize: "14px"
                    }}>
                      {question.text}
                    </p>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "11px",
                      color: "#6c757d"
                    }}>
                      <span style={{ 
                        fontWeight: "bold", 
                        color: "#dc3545" 
                      }}>
                        👤 {question.author}
                      </span>
                      <span style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        fontSize: "10px",
                        fontWeight: "500"
                      }}>
                        👍 {question.likes}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!loading && comments.length === 0 && !error && (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          border: "2px dashed #dc3545",
          color: "#6c757d"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📺</div>
          <h3 style={{ color: "#dc3545", marginBottom: "10px" }}>
            Ready to Analyze YouTube Comments!
          </h3>
          <p style={{ fontSize: "1.1rem", margin: "0" }}>
            Enter a YouTube URL above and click "Analyze Comments" to get started.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;