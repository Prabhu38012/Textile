import React, { useState, useEffect } from "react";
import s1 from "../../assets/sigin.jpg";
import s2 from "../../assets/sigin2.jpg";
import s3 from "../../assets/sigin3.jpg";
import s4 from "../../assets/sigin4.jpg";
import { useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_URL || `${API}`;

export default function AdminSignin() {
	const [slide, setSlide] = useState(0);
	const images = [s2, s3, s4];

	const navigate = useNavigate();
	const [first, setFirst] = useState("");
	const [last, setLast] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

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

	const subtleText = {
		color: "#b7b2cc",
		marginTop: 10
	};

	const inputStyle = {
		width: "100%",
		padding: "14px 16px",
		background: "#2b2835",
		border: "1px solid #4a445e",
		borderRadius: 12,
		color: "#eae6ff"
	};

	const formRow = {
		display: "grid",
		gridTemplateColumns: "1fr 1fr",
		gap: 14,
		marginTop: 14
	};

	const primaryBtn = {
		marginTop: 20,
		width: "100%",
		padding: "14px 18px",
		borderRadius: 14,
		background: "#7b5cf1",
		color: "#fff",
		border: "1px solid #8a73f4",
		fontWeight: 700,
		cursor: "pointer"
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

	return (
		<div style={pageStyle}>
			<div style={cardStyle}>
				{/* Left visual panel */}
				<div style={leftStyle}>
					<div style={leftOverlay} />
					<div style={leftContent}>
						<h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>
							Admin Registration
							<br />Authorized Access Only
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
					<div style={adminBadge}>🔐 ADMIN REGISTRATION</div>
					<h1 style={titleStyle}>Create Admin Account</h1>
					<p style={subtleText}>
						Already have an account? <a href="/admin-login" style={{ color: "#cbbafc" }}>Login here</a>
						<br />
						Regular user? <a href="/signin" style={{ color: "#cbbafc" }}>Sign up here</a>
					</p>

					<form onSubmit={
						(e) => {
							e.preventDefault();
							setError("");
							(async () => {
								try {
									const name = `${first} ${last}`.trim();
									const res = await fetch(`${API}/api/auth/signup`, {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({ 
											name, 
											email, 
											password,
											isAdmin: true // Mark as admin registration
										})
									});
									const data = await res.json();
									if (!res.ok) return setError(data.error || 'Signup failed');

									// show email send status to user
									if (data.email) {
										if (data.email.ok) alert('Welcome email sent to ' + (email));
										else alert('Welcome email failed: ' + (data.email.error || 'unknown'));
									}
									localStorage.setItem('token', data.token);
									navigate('/admin');
								} catch (err) {
									setError('Network error');
								}
							})();
						}
					}>
						<div style={formRow}>
							<input 
								value={first} 
								onChange={(e) => setFirst(e.target.value)} 
								style={inputStyle} 
								placeholder="First name" 
								required
							/>
							<input 
								value={last} 
								onChange={(e) => setLast(e.target.value)} 
								style={inputStyle} 
								placeholder="Last name" 
								required
							/>
						</div>

						<div style={{ marginTop: 14 }}>
							<input 
								value={email} 
								onChange={(e) => setEmail(e.target.value)} 
								style={inputStyle} 
								placeholder="Admin Email" 
								type="email"
								required
							/>
						</div>

						<div style={{ marginTop: 14, position: "relative" }}>
							<input 
								value={password} 
								onChange={(e) => setPassword(e.target.value)} 
								style={inputStyle} 
								placeholder="Password (min 6 characters)" 
								type="password"
								required
								minLength={6}
							/>
						</div>

						{error && <div style={{ color: '#ffb4b4', marginTop: 10, padding: '10px', background: '#3a1f1f', borderRadius: 8 }}>{error}</div>}

						<button type="submit" style={primaryBtn}>Create Admin Account</button>

						<div style={sepRow}>
							<div style={line} />
							<span>Secure Registration</span>
							<div style={line} />
						</div>
					</form>
				</div>
			</div>

			{/* Responsive tweaks */}
			<style>{`
				@media (max-width: 980px) {
					div[style*='grid-template-columns: 1.1fr 1fr'] { grid-template-columns: 1fr; }
					div[style*='grid-template-columns: 1fr 1fr'] { grid-template-columns: 1fr; }
					div[style*='padding: 40px 48px'] { padding: 28px 24px !important; }
					h1[style*='2.2rem'] { font-size: 1.8rem !important; }
				}
				button:hover { filter: brightness(1.06); }
				input:focus { outline: none; border-color: #7b5cf1; box-shadow: 0 0 0 3px rgba(123,92,241,0.25); }
			`}</style>
		</div>
	);
}
