import React, { useState, useEffect } from "react";
import s1 from "../../assets/sigin.jpg";
import s2 from "../../assets/sigin2.jpg";
import s3 from "../../assets/sigin3.jpg";
import s4 from "../../assets/sigin4.jpg";
import { Link, useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_URL || `${API}`;

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "prabhuchennimalaikd.23aim@kongu.edu";

export default function AdminLogin() {
  const [slide, setSlide] = useState(0);
  const images = [s2, s3, s4];

  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % images.length), 5000);
    return () => clearInterval(t);
  }, []);

  const pageStyle = {
    minHeight: "100vh",
    background: `url(${s1}) center/cover no-repeat`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px"
  };

  const cardStyle = {
    width: "100%",
    maxWidth: 1100,
    background: "#1f1c28",
    borderRadius: 22,
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr"
  };

  const leftStyle = {
    position: "relative",
    background: `url(${images[slide]}) center/cover no-repeat`
  };

  const leftOverlay = {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(24,22,33,0.55) 0%, rgba(24,22,33,0.7) 100%)"
  };

  const leftContent = {
    position: "absolute",
    left: 24,
    bottom: 28,
    color: "#fff"
  };

  const dotsStyle = {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginTop: 16
  };

  const dot = (active) => ({
    width: 26,
    height: 4,
    borderRadius: 6,
    background: active ? "#e6e0ff" : "#726b86"
  });

  const rightStyle = {
    padding: "40px 48px",
    color: "#eae6ff"
  };

  const titleStyle = {
    fontSize: "2.2rem",
    fontWeight: 800,
    margin: 0,
    color: "#ffffff"
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    background: "#2b2835",
    border: "1px solid #4a445e",
    borderRadius: 12,
    color: "#eae6ff",
    boxSizing: "border-box"
  };

  const disabledInputStyle = {
    ...inputStyle,
    opacity: 0.6,
    cursor: "not-allowed"
  };

  const checkboxRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    color: "#cfc9e8"
  };

  const primaryBtn = {
    marginTop: 20,
    width: "100%",
    padding: "14px 18px",
    borderRadius: 14,
    background: loading ? "#5a43c0" : "#7b5cf1",
    color: "#fff",
    border: "1px solid #8a73f4",
    fontWeight: 700,
    cursor: loading ? "not-allowed" : "pointer"
  };

  const sepRow = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
    color: "#7a748e"
  };

  const line = {
    height: 1,
    background: "#3a344a",
    flex: 1
  };

  const adminBadge = {
    display: "inline-block",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    padding: "6px 16px",
    borderRadius: 20,
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: 16,
    boxShadow: "0 4px 12px rgba(118, 75, 162, 0.3)"
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: ADMIN_EMAIL, password })
        });
        const data = await res.json();
        if (!res.ok) return setError(data.error || "Login failed");

        if (!data.user?.isAdmin) {
          return setError("Access denied. Admin privileges required.");
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userName", data.user.name);
        navigate("/admin");
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Left visual panel */}
        <div style={leftStyle}>
          <div style={leftOverlay} />
          <div style={leftContent}>
            <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>
              Admin Portal
              <br />Secure Access Only
            </h3>
            <div style={dotsStyle}>
              {images.map((_, i) => (
                <div key={i} style={dot(i === slide)} />
              ))}
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div style={rightStyle}>
          <div style={adminBadge}>🔐 ADMIN ACCESS</div>
          <h1 style={titleStyle}>Admin Login</h1>
          <p style={{ color: "#b7b2cc", marginTop: 8, fontSize: "0.9rem" }}>
            Authorized personnel only
          </p>

          <form onSubmit={handleLogin}>
            {/* Email — locked to admin email */}
            <div style={{ marginTop: 20 }}>
              <input
                value={ADMIN_EMAIL}
                style={disabledInputStyle}
                placeholder="Admin Email"
                type="email"
                readOnly
              />
            </div>

            <div style={{ marginTop: 14, position: "relative" }}>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="Admin Password"
                type="password"
                required
                autoFocus
              />
            </div>

            {error && (
              <div style={{ color: "#ffb4b4", marginTop: 10, padding: "10px", background: "#3a1f1f", borderRadius: 8 }}>
                {error}
              </div>
            )}

            <div style={checkboxRow}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" /> Remember me
              </label>
              <Link
                to={`/forgot-password?email=${encodeURIComponent(ADMIN_EMAIL)}`}
                style={{ color: "#cbbafc" }}
              >
                Forgot password?
              </Link>
            </div>

            <button type="submit" style={primaryBtn} disabled={loading}>
              {loading ? "Logging in…" : "Admin Login"}
            </button>

            <div style={sepRow}>
              <div style={line} />
              <span>Authorized Personnel Only</span>
              <div style={line} />
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          div[style*='grid-template-columns: 1.1fr 1fr'] { grid-template-columns: 1fr; }
          div[style*='padding: 40px 48px'] { padding: 28px 24px !important; }
          h1[style*='2.2rem'] { font-size: 1.8rem !important; }
        }
        button:hover:not(:disabled) { filter: brightness(1.06); }
        input:focus { outline: none; border-color: #7b5cf1; box-shadow: 0 0 0 3px rgba(123,92,241,0.25); }
      `}</style>
    </div>
  );
}
