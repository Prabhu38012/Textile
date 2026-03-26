import { useState, useEffect } from 'react';
import DashboardNav from './DashboardNav';
import TamilChat from './TamilChat';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

import './UserDashboard.css';

const UserDashboard = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchMaterials();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMaterials(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMaterials = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setRefreshing(true);
      }
      
      const response = await fetch(`${API}/api/materials`);
      const data = await response.json();
      console.log('Fetched materials:', data.materials?.length || 0, 'materials');
      if (data.materials) {
        setMaterials(data.materials);
      }
      setLoading(false);
      setLastRefresh(new Date());
      setError('');
    } catch (err) {
      console.error('Fetch materials error:', err);
      setError('Failed to load materials');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchMaterials();
  };

  const categories = ['All', ...new Set(materials.map(m => m.category).filter(Boolean))];

  const filteredMaterials = materials.filter(material => {
    const matchesCategory = selectedCategory === 'All' || material.category === selectedCategory;
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="loading">Loading materials...</div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <DashboardNav />
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Buy Now</h1>
            <p className="subtitle">Browse our collection of quality textile materials</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={handleManualRefresh} 
              disabled={refreshing}
              className="refresh-btn"
              title="Refresh materials"
            >
              {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            <span className="last-refresh">Last updated: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="materials-container">
        {filteredMaterials.length === 0 ? (
          <div className="no-materials">
            <p>No materials found</p>
          </div>
        ) : (
          <div className="materials-grid">
            {filteredMaterials.map((material) => (
              <div key={material._id} className="material-card">
                {material.imageUrl ? (
                  <div className="card-image">
                    <img src={material.imageUrl} alt={material.title} />
                  </div>
                ) : (
                  <div className="card-image-placeholder">
                    <span>No Image</span>
                  </div>
                )}
                
                <div className="card-content">
                  <h3 className="material-title">{material.title}</h3>
                  
                  {material.description && (
                    <p className="material-description">{material.description}</p>
                  )}
                  
                  <div className="material-meta">
                    {material.category && (
                      <span className="badge category-badge">{material.category}</span>
                    )}
                    <span className="badge price-badge">${material.price.toFixed(2)}</span>
                  </div>

                  <div className="material-stock">
                    <span className={material.quantity > 0 ? 'in-stock' : 'out-of-stock'}>
                      {material.quantity > 0 ? `${material.quantity} units available` : 'Out of stock'}
                    </span>
                  </div>

                  <button 
                    className="order-btn"
                    disabled={material.quantity === 0}
                  >
                    {material.quantity > 0 ? 'Order Now' : 'Unavailable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Tamil Chat Component */}
      <TamilChat 
        userId={localStorage.getItem('userId') || 'guest'} 
        userName={localStorage.getItem('userName') || 'User'} 
      />
    </div>
  );
};

export default UserDashboard;
