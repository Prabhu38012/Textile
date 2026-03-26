import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import p3 from "../../assets/photo3.jpg";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";


export default function Buy() {
	const [materials, setMaterials] = useState([]);
	const [loading, setLoading] = useState(true);
	const { addToCart } = useCart();
	const navigate = useNavigate();

	useEffect(() => {
		fetchMaterials();
	}, []);

	const fetchMaterials = async () => {
		try {
			const response = await fetch(`${API}/api/materials`);
			const data = await response.json();
			console.log('Fetched materials for Buy Now:', data.materials?.length || 0);
			if (data.materials) {
				setMaterials(data.materials);
			}
			setLoading(false);
		} catch (err) {
			console.error('Fetch materials error:', err);
			setLoading(false);
		}
	};

	const section = {
		maxWidth: 1100,
		margin: "36px auto",
		padding: "0 24px",
		boxSizing: "border-box"
	};

	const header = {
		display: "flex",
		alignItems: "baseline",
		justifyContent: "space-between",
		marginBottom: 16
	};

	const title = { fontSize: "1.6rem", fontWeight: 800, margin: 0 };
	const subtitle = { color: "#6b7280", fontSize: "0.95rem" };

	const grid = {
		display: "grid",
		gridTemplateColumns: "repeat(4, 1fr)",
		gap: 18
	};

	const card = {
		background: "#ffffff",
		border: "1px solid #e5e7eb",
		borderRadius: 12,
		overflow: "hidden",
		boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
		display: "flex",
		flexDirection: "column"
	};

	const imgWrap = { height: 170, overflow: "hidden", position: "relative" };
	const img = { width: "100%", height: "100%", objectFit: "cover", display: "block" };

	const tag = {
		position: "absolute",
		top: 10,
		left: 10,
		background: "rgba(0,0,0,0.65)",
		color: "#fff",
		fontSize: 12,
		padding: "4px 8px",
		borderRadius: 999
	};

	const body = { padding: 14, flex: 1 };
	const name = { fontWeight: 700, margin: 0 };
	const desc = { color: "#4b5563", marginTop: 6, fontSize: 14 };

	const row = {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 12
	};

	const price = { fontWeight: 800, color: "#111827" };
	const rating = { color: "#f59e0b", fontWeight: 600 };

	const cta = {
		display: "flex",
		gap: 10,
		padding: 14,
		borderTop: "1px solid #e5e7eb"
	};

	const buyBtn = {
		background: "#d4a574",
		color: "#fff",
		border: "none",
		borderRadius: 10,
		padding: "10px 14px",
		fontWeight: 700,
		cursor: "pointer",
		flex: 1
	};

	const outlineBtn = {
		background: "transparent",
		color: "#374151",
		border: "1px solid #d1d5db",
		borderRadius: 10,
		padding: "10px 14px",
		fontWeight: 600,
		cursor: "pointer",
		flex: 1
	};

	const onBuy = (p) => {
		// navigate to payment page and pass product in location state
		navigate('/payment', { state: { product: p } });
	};

	const handleAddToCart = (item) => {
		addToCart(item, 1000); // Default 1000 meters
		alert(`${item.title} added to cart!`);
	};

	return (
		<section id="buy" style={section} aria-label="Buy Now">
			<div style={header}>
				<h2 style={title}>Buy Now</h2>
			</div>

			{loading ? (
				<div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
					Loading materials...
				</div>
			) : materials.length === 0 ? (
				<div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
					No materials available. Please check back later or contact admin.
				</div>
			) : (
				<div style={grid}>
					{materials.map((item) => (
						<article key={item._id || item.id} style={card} className="buy-card">
							<div style={imgWrap}>
								<img 
									src={item.imageUrl || item.image || p3} 
									alt={item.title} 
									style={img} 
									onError={(e) => { e.target.src = p3; }}
								/>
								{item.tag && <span style={tag}>{item.tag}</span>}
								{item.category && !item.tag && <span style={tag}>{item.category}</span>}
							</div>
							<div style={body}>
								<h3 style={name}>{item.title}</h3>
								<p style={desc}>{item.description || item.desc}</p>

								<div style={row}>
									<span style={price}>Rs.{item.price}</span>
									{item.rating && <span style={rating}>★ {item.rating}</span>}
								</div>
								{item.quantity !== undefined && (
									<div style={{ marginTop: 8, fontSize: 12, color: item.quantity > 0 ? '#059669' : '#dc2626' }}>
										{item.quantity > 0 ? `${item.quantity} meters available` : 'Out of stock'}
									</div>
								)}
							</div>
							<div style={cta}>
								<button 
									className="buy-secondary" 
									style={outlineBtn} 
									onClick={() => handleAddToCart(item)}
									disabled={item.quantity === 0}
								>
									Add to Cart
								</button>
								<button 
									className="buy-primary" 
									style={buyBtn} 
									onClick={() => onBuy(item)}
									disabled={item.quantity === 0}
								>
									Buy Now
								</button>
							</div>
						</article>
					))}
				</div>
			)}

			<style>{`
				html { scroll-behavior: smooth; }
				.buy-card { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
				.buy-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.12); }
				.buy-primary:hover { filter: brightness(1.05); }
				.buy-secondary:hover { background: #fff; border-color: #bfc5cc; }

				@media (max-width: 1000px) {
					section[aria-label='Buy Now'] > div + div { grid-template-columns: repeat(2, 1fr) !important; }
				}
				@media (max-width: 560px) {
					section[aria-label='Buy Now'] > div + div { grid-template-columns: 1fr !important; }
				}
			`}</style>
		</section>
	);
}
