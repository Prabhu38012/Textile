import React, { useState, useEffect } from "react";
import "./SampleRequest.css";

const API = import.meta.env.VITE_API_URL || `${API}`;

export default function SampleRequest() {
    const [materials, setMaterials] = useState([]);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        company: "",
        email: "",
        phone: "",
        address: "",
        notes: ""
    });

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/materials`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            console.log('Fetched materials data:', data);
            // Show only first 6 active materials for sample requests
            const materialsArray = data.materials || [];
            setMaterials(materialsArray.filter(m => m.isActive).slice(0, 6));
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch materials:', err);
            setLoading(false);
        }
    };

    const toggleMaterialSelection = (materialId) => {
        setSelectedMaterials(prev => 
            prev.includes(materialId) 
                ? prev.filter(id => id !== materialId)
                : [...prev, materialId]
        );
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (selectedMaterials.length === 0) {
            alert('Please select at least one material');
            return;
        }

        const requestData = {
            ...formData,
            materials: selectedMaterials,
            requestDate: new Date().toISOString()
        };

        try {
            // Get selected material details
            const selectedMaterialDetails = materials
                .filter(m => selectedMaterials.includes(m._id))
                .map(m => m.title)
                .join(', ');

            // Get user info
            const userId = localStorage.getItem('userId');
            const userName = localStorage.getItem('userName') || formData.name;

            // Send message to admin via chat
            const messageText = `📦 New Sample Request\n\n` +
                `Name: ${formData.name}\n` +
                `Company: ${formData.company}\n` +
                `Email: ${formData.email}\n` +
                `Phone: ${formData.phone}\n` +
                `Address: ${formData.address}\n\n` +
                `Materials Requested:\n${selectedMaterialDetails}\n\n` +
                `${formData.notes ? `Notes: ${formData.notes}\n\n` : ''}` +
                `Request Date: ${new Date().toLocaleString()}`;

            const token = localStorage.getItem('token');
            await fetch(`${API}/api/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: userId,
                    userName: userName,
                    text: messageText,
                    sender: 'user'
                })
            });

            console.log('Sample Request:', requestData);
            alert(`Sample request submitted for ${selectedMaterials.length} material(s)! Admin has been notified.`);
            
            // Reset form
            setSelectedMaterials([]);
            setFormData({
                name: "",
                company: "",
                email: "",
                phone: "",
                address: "",
                notes: ""
            });
            setShowForm(false);
        } catch (error) {
            console.error('Error submitting sample request:', error);
            alert('Sample request submitted but failed to notify admin. Please contact support.');
        }
    };

    if (loading) {
        return (
            <section className="sample-request-section">
                <div className="sample-request-container">
                    <div className="loading-spinner">Loading materials...</div>
                </div>
            </section>
        );
    }

    return (
        <section className="sample-request-section">
            <div className="sample-request-container">
                {/* Header Section */}
                <div className="sample-header">
                    <h2 className="sample-title">
                        <span className="sample-icon">📦</span>
                        Request Free Samples
                    </h2>
                    <p className="sample-subtitle">
                        Select materials and get physical samples delivered to your doorstep
                    </p>
                </div>

                {/* Materials Grid */}
                <div className="materials-grid">
                    {materials.length === 0 ? (
                        <div className="col-span-full text-center py-16">
                            <div className="material-placeholder inline-flex flex-col items-center justify-center" style={{width: '200px', height: '200px', borderRadius: '16px'}}>
                                <span className="placeholder-icon">🧵</span>
                                <p className="text-sm font-medium mt-4" style={{color: '#6b7280'}}>No materials available</p>
                                <p className="text-xs" style={{color: '#9ca3af', marginTop: '8px'}}>Check back later for samples</p>
                            </div>
                        </div>
                    ) : (
                        materials.map((material) => (
                        <div 
                            key={material._id}
                            className={`material-card ${selectedMaterials.includes(material._id) ? 'selected' : ''}`}
                            onClick={() => toggleMaterialSelection(material._id)}
                        >
                            <div className="material-image-container">
                                {material.imageUrl ? (
                                    <img 
                                        src={material.imageUrl} 
                                        alt={material.title}
                                        className="material-image"
                                    />
                                ) : (
                                    <div className="material-placeholder">
                                        <span className="placeholder-icon">🧵</span>
                                    </div>
                                )}
                                {selectedMaterials.includes(material._id) && (
                                    <div className="selected-badge">
                                        <span className="check-icon">✓</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="material-info">
                                <h3 className="material-name">{material.title}</h3>
                                {material.category && (
                                    <span className="material-category">{material.category}</span>
                                )}
                                <p className="material-description">
                                    {material.description || "Premium quality textile material"}
                                </p>
                                {material.price > 0 && (
                                    <div className="material-price">₹{material.price}/meter</div>
                                )}
                            </div>
                        </div>
                    ))
                    )}
                </div>

                {/* Selection Summary & Request Button */}
                {selectedMaterials.length > 0 && (
                    <div className="selection-summary">
                        <div className="summary-content">
                            <span className="summary-text">
                                {selectedMaterials.length} material{selectedMaterials.length > 1 ? 's' : ''} selected
                            </span>
                            <button 
                                className="request-btn"
                                onClick={() => setShowForm(!showForm)}
                            >
                                {showForm ? 'Cancel Request' : 'Request Samples'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Request Form */}
                {showForm && (
                    <div className="request-form-container">
                        <form className="request-form" onSubmit={handleSubmitRequest}>
                            <h3 className="form-title">Sample Request Details</h3>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input 
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Company Name *</label>
                                    <input 
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Company name"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input 
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone *</label>
                                    <input 
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="+91 XXXXX XXXXX"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Delivery Address *</label>
                                <textarea 
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    rows="3"
                                    placeholder="Complete address for sample delivery"
                                />
                            </div>

                            <div className="form-group">
                                <label>Additional Notes</label>
                                <textarea 
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows="2"
                                    placeholder="Any special requirements or instructions..."
                                />
                            </div>

                            <button type="submit" className="submit-btn">
                                Submit Sample Request
                            </button>
                        </form>
                    </div>
                )}

                {/* Info Banner */}
                <div className="info-banner">
                    <div className="info-item">
                        <span className="info-icon">🚚</span>
                        <span>Free Delivery</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">⚡</span>
                        <span>Quick Processing</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">✨</span>
                        <span>Quality Assured</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
