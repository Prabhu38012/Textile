import React, { useState } from "react";
import s1 from "../../assets/sigin.jpg";
import { useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_URL || `${API}`;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const pageStyle = {
    minHeight: "100vh",
    background: `url(${s1}) center/cover no-repeat`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: 440,
    background: "#1f1c28",
    borderRadius: 22,
    boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
    padding: "44px 40px",
    color: "#eae6ff",
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    background: "#2b2835",
    border: "1px solid #4a445e",
    borderRadius: 12,
    color: "#eae6ff",
    fontSize: "1rem",
    boxSizing: "border-box",
  };

  const btnStyle = {
    marginTop: 20,
    width: "100%",
    padding: "14px 18px",
    borderRadius: 14,
    background: loading ? "#5a43c0" : "#7b5cf1",
    color: "#fff",
    border: "1px solid #8a73f4",
    fontWeight: 700,
    cursor: loading ? "not-allowed" : "pointer",
    fontSize: "1rem",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email) return setError("Please enter your email address.");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Something went wrong.");
      setMessage("If that email exists, an OTP has been sent. Check your inbox!");
      // Navigate after short delay so user can read the message
      setTimeout(() => navigate(`/verify-otp?email=${encodeURIComponent(email)}`), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Icon */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg,#7b5cf1,#9b7cf8)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 28
          }}>🔑</div>
        </div>

        <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0, color: "#fff", textAlign: "center" }}>
          Forgot Password?
        </h1>
        <p style={{ color: "#b7b2cc", marginTop: 10, textAlign: "center", fontSize: "0.95rem" }}>
          Enter your email and we'll send you a one-time password to reset it.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your registered email"
            style={inputStyle}
            autoFocus
          />

          {error && <div style={{ color: "#ffb4b4", marginTop: 12, fontSize: "0.9rem" }}>{error}</div>}
          {message && <div style={{ color: "#86efac", marginTop: 12, fontSize: "0.9rem" }}>{message}</div>}

          <button id="send-otp-btn" type="submit" style={btnStyle} disabled={loading}>
            {loading ? "Sending OTP…" : "Send OTP"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, color: "#7a748e", fontSize: "0.9rem" }}>
          Remember your password?{" "}
          <a href="/login" style={{ color: "#cbbafc" }}>Log in</a>
        </p>

        <style>{`
          input:focus { outline: none; border-color: #7b5cf1 !important; box-shadow: 0 0 0 3px rgba(123,92,241,0.25); }
          button:hover:not(:disabled) { filter: brightness(1.1); }
        `}</style>
      </div>
    </div>
  );
}
