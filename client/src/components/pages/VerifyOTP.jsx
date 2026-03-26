import React, { useState, useRef, useEffect } from "react";
import s1 from "../../assets/sigin.jpg";
import { useNavigate, useSearchParams } from "react-router-dom";
const API = import.meta.env.VITE_API_URL || `${API}`;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef([]);

  // Start 60-second cooldown on mount
  useEffect(() => {
    setResendCooldown(60);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function handleChange(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputs.current[5]?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const otp = digits.join("");
    if (otp.length < 6) return setError("Please enter the full 6-digit OTP.");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Invalid OTP.");
      navigate(`/reset-password?token=${encodeURIComponent(data.resetToken)}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendMsg("");
    setError("");
    try {
      await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendMsg("A new OTP has been sent to your email.");
      setResendCooldown(60);
    } catch {
      setError("Failed to resend OTP.");
    }
  }

  const pageStyle = {
    minHeight: "100vh",
    background: `url(${s1}) center/cover no-repeat`,
    display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
  };

  const cardStyle = {
    width: "100%", maxWidth: 440, background: "#1f1c28",
    borderRadius: 22, boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
    padding: "44px 40px", color: "#eae6ff",
  };

  const digitInput = {
    width: 48, height: 56, borderRadius: 12,
    background: "#2b2835", border: "2px solid #4a445e",
    color: "#eae6ff", fontSize: "1.5rem", fontWeight: 700,
    textAlign: "center", outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const btnStyle = {
    marginTop: 20, width: "100%", padding: "14px 18px",
    borderRadius: 14, background: loading ? "#5a43c0" : "#7b5cf1",
    color: "#fff", border: "1px solid #8a73f4",
    fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: "1rem",
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg,#7b5cf1,#9b7cf8)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28
          }}>📩</div>
        </div>

        <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0, color: "#fff", textAlign: "center" }}>
          Check Your Email
        </h1>
        <p style={{ color: "#b7b2cc", marginTop: 10, textAlign: "center", fontSize: "0.9rem" }}>
          We sent a 6-digit OTP to<br />
          <strong style={{ color: "#cbbafc" }}>{email || "your email"}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }} onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                id={`otp-digit-${i}`}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={digitInput}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && <div style={{ color: "#ffb4b4", marginTop: 14, textAlign: "center", fontSize: "0.9rem" }}>{error}</div>}
          {resendMsg && <div style={{ color: "#86efac", marginTop: 14, textAlign: "center", fontSize: "0.9rem" }}>{resendMsg}</div>}

          <button id="verify-otp-btn" type="submit" style={btnStyle} disabled={loading}>
            {loading ? "Verifying…" : "Verify OTP"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, color: "#7a748e", fontSize: "0.9rem" }}>
          Didn't receive it?{" "}
          {resendCooldown > 0 ? (
            <span style={{ color: "#7a748e" }}>Resend in {resendCooldown}s</span>
          ) : (
            <button onClick={handleResend} style={{ background: "none", border: "none", color: "#cbbafc", cursor: "pointer", padding: 0, fontSize: "inherit" }}>
              Resend OTP
            </button>
          )}
        </p>
        <p style={{ textAlign: "center", marginTop: 10, color: "#7a748e", fontSize: "0.9rem" }}>
          <a href="/forgot-password" style={{ color: "#cbbafc" }}>← Back</a>
        </p>

        <style>{`
          input[type="text"]:focus { border-color: #7b5cf1 !important; box-shadow: 0 0 0 3px rgba(123,92,241,0.3); }
          button:hover:not(:disabled) { filter: brightness(1.1); }
        `}</style>
      </div>
    </div>
  );
}
