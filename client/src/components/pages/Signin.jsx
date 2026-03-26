import React, { useState, useEffect } from "react";
import s1 from "../../assets/sigin.jpg";
import s2 from "../../assets/sigin2.jpg";
import s3 from "../../assets/sigin3.jpg";
import s4 from "../../assets/sigin4.jpg";
import { useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_URL || `${API}`;
export default function Signin() {
	const [slide, setSlide] = useState(0);
	const images = [
		s2,
        s3,
        s4
       ];

	const navigate = useNavigate();
	const [first, setFirst] = useState("");
	const [last, setLast] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [companyName, setCompanyName] = useState("");
	const [address, setAddress] = useState("");
	const [contactDetails, setContactDetails] = useState("");
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
		padding: "24px",    
        
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

	const logoStyle = {
		position: "absolute",
		top: 18,
		left: 18,
		color: "#fff",
		fontWeight: 800,
		letterSpacing: 2
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

	const formRow = {
		display: "grid",
		gridTemplateColumns: "1fr 1fr",
		gap: 14,
		marginTop: 18
	};

	const inputStyle = {
		width: "100%",
		padding: "14px 16px",
		background: "#2b2835",
		border: "1px solid #4a445e",
		borderRadius: 12,
		color: "#eae6ff"
	};

	const checkboxRow = {
		display: "flex",
		alignItems: "center",
		gap: 10,
		marginTop: 16,
		color: "#cfc9e8"
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

	const providers = {
		display: "flex",
		justifyContent: "center",
		marginTop: 14
	};

	const providerBtn = {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		padding: "12px 24px",
		background: "#2b2835",
		border: "1px solid #4a445e",
		borderRadius: 12,
		color: "#eae6ff",
		cursor: "pointer",
		width: "100%"
	};

	return (
		<div style={pageStyle}>
			<div style={cardStyle}>
				{/* Left visual panel */}
				<div style={leftStyle}>
					
					<div style={leftOverlay} />
					<div style={leftContent}>
						<h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>
							Capturing Moments,
							<br />Creating Memories
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
					<h1 style={titleStyle}>Create an account</h1>
					<p style={subtleText}>
						Already have an account? <a href="/login" style={{ color: "#cbbafc" }}>Log in</a>
					</p>

					<form onSubmit={(e) => {
						e.preventDefault();
						setError("");					
					// Validate password match
					if (password !== confirmPassword) {
						setError('Passwords do not match');
						return;
					}
											(async () => {
							try {
								const name = `${first} ${last}`.trim();
								const res = await fetch(`${API}/api/auth/signup`, {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ name, email, password, companyName, address, contactDetails })
								});
								const data = await res.json();
																if (!res.ok) return setError(data.error || 'Signup failed');
																// show email send status to user
																if (data.email) {
																	if (data.email.ok) alert('Welcome email sent to ' + (email));
																	else alert('Welcome email failed: ' + (data.email.error || 'unknown'));
																}
																
																// Store user data in localStorage
																localStorage.setItem('token', data.token);
																if (data.user) {
																	localStorage.setItem('userId', data.user.id);
																	localStorage.setItem('userName', data.user.name);
																}
																
																navigate('/home');
							} catch (err) {
								setError('Network error');
							}
						})();
					}}>
						<div style={formRow}>
							<input value={first} onChange={(e) => setFirst(e.target.value)} style={inputStyle} placeholder="First name" />
							<input value={last} onChange={(e) => setLast(e.target.value)} style={inputStyle} placeholder="Last name" />
						</div>

						<div style={{ marginTop: 14 }}>
							<input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="Email" />
						</div>

						<div style={{ marginTop: 14, position: "relative" }}>
							<input value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="Enter your password" type="password" />
							<span style={{ position: "absolute", right: 16, top: 16, color: "#9c95b1" }}></span>
						</div>

					<div style={{ marginTop: 14, position: "relative" }}>
						<input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="Confirm your password" type="password" />
						<span style={{ position: "absolute", right: 16, top: 16, color: "#9c95b1" }}></span>
					</div>

					<div style={{ marginTop: 14 }}>
						<input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={inputStyle} placeholder="Company Name" />
					</div>

					<div style={{ marginTop: 14 }}>
						<input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} placeholder="Address" />
					</div>

					<div style={{ marginTop: 14 }}>
						<input value={contactDetails} onChange={(e) => setContactDetails(e.target.value)} style={inputStyle} placeholder="Contact Details (Phone)" />
					</div>
					{error && <div style={{ color: '#ffb4b4', marginTop: 10 }}>{error}</div>}
					<button type="submit" style={primaryBtn}>Create account</button>

					<div style={sepRow}>
						<div style={line} />
						<span>or continue with</span>
						<div style={line} />
					</div>

					<div style={providers}>
						<button 
							type="button"
							style={providerBtn}
							onClick={() => {
								window.location.href = `${API}/api/auth/google`;
							}}
						>
							<svg width="20" height="20" viewBox="0 0 48 48">
								<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
								<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
								<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
								<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
							</svg>
							Continue with Google
						</button>
					</div>
				</form>
				</div>
			</div>

			{/* Responsive tweaks */}
			<style>{`
				@media (max-width: 980px) {
					div[style*='grid-template-columns: 1.1fr 1fr'] { grid-template-columns: 1fr; }
					div[style*='padding: 40px 48px'] { padding: 28px 24px !important; }
					h1[style*='2.2rem'] { font-size: 1.8rem !important; }
				}
				button:hover { filter: brightness(1.06); }
				input:focus { outline: none; border-color: #7b5cf1; box-shadow: 0 0 0 3px rgba(123,92,241,0.25); }
			`}</style>
		</div>
	);
}

