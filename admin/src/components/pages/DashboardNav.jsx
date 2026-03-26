import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

import './DashboardNav.css';

const DashboardNav = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Try to get user info
      fetch(`${API}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
          }
        })
        .catch(err => console.error('Error fetching user:', err));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="dashboard-nav">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>Prema Textile Mills</h2>
        </div>
        
        <div className="nav-links">
          <button onClick={() => navigate('/home')} className="nav-link">
            Home
          </button>
          
          {user && user.isAdmin && (
            <button onClick={() => navigate('/admin')} className="nav-link">
              Admin Dashboard
            </button>
          )}
          
          {user ? (
            <div className="nav-user">
              <span className="user-name">{user.name || user.email}</span>
              {user.isAdmin && <span className="admin-badge">Admin</span>}
              <button onClick={handleLogout} className="nav-link logout">
                Logout
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/')} className="nav-link">
              LogOut
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;
