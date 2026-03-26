import React, { useState } from "react";
import s1 from "../../assets/sigin.jpg";
import { useNavigate, useSearchParams } from "react-router-dom";
const API = import.meta.env.VITE_API_URL || `${API}`;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const resetToken = params.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  const inputWrap = { position: "relative", marginTop: 16 };

  const inputStyle = {
    width: "100%", padding: "14px 44px 14px 16px",
    background: "#2b2835", border: "1px solid #4a445e",
    borderRadius: 12, color: "#eae6ff", fontSize: "1rem",
    boxSizing: "border-box",
  };

  const eyeBtn = {
    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", color: "#9c95b1", cursor: "pointer", fontSize: 18, padding: 0,
  };

  const btnStyle = {
    marginTop: 24, width: "100%", padding: "14px 18px",
    borderRadius: 14, background: loading ? "#5a43c0" : "#7b5cf1",
    color: "#fff", border: "1px solid #8a73f4",
    fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: "1rem",
  };

  // Password strength
  const strength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "#f87171", "#fbbf24", "#34d399"];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!resetToken) return setError("Invalid or missing reset token. Please start over.");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Reset failed.");
      setSuccess(true);
      setTimeout(() => navigate("/admin-login"), 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg,#7b5cf1,#9b7cf8)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28
          }}>🔒</div>
        </div>

        <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0, color: "#fff", textAlign: "center" }}>
          Set New Password
        </h1>
        <p style={{ color: "#b7b2cc", marginTop: 10, textAlign: "center", fontSize: "0.9rem" }}>
          Choose a strong password for your account.
        </p>

        {success ? (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <p style={{ color: "#86efac", fontSize: "1rem", marginTop: 12, fontWeight: 600 }}>
              Password reset successfully!
            </p>
            <p style={{ color: "#b7b2cc", fontSize: "0.9rem" }}>Redirecting you to login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
            <div style={inputWrap}>
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                style={inputStyle}
                autoFocus
              />
              <button type="button" style={eyeBtn} onClick={() => setShowNew((v) => !v)}>
                {showNew ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Strength bar */}
            {newPassword && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3].map((s) => (
                    <div key={s} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: strength >= s ? strengthColor[strength] : "#3a344a",
                      transition: "background 0.3s"
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: "0.8rem", color: strengthColor[strength], marginTop: 4, display: "block" }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}

            <div style={inputWrap}>
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={inputStyle}
              />
              <button type="button" style={eyeBtn} onClick={() => setShowConfirm((v) => !v)}>
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>

            {error && <div style={{ color: "#ffb4b4", marginTop: 12, fontSize: "0.9rem" }}>{error}</div>}

            <button id="reset-password-btn" type="submit" style={btnStyle} disabled={loading}>
              {loading ? "Saving…" : "Reset Password"}
            </button>
          </form>
        )}

        <style>{`
          input:focus { outline: none; border-color: #7b5cf1 !important; box-shadow: 0 0 0 3px rgba(123,92,241,0.25); }
          button:hover:not(:disabled) { filter: brightness(1.1); }
        `}</style>
      </div>
    </div>
  );
}
