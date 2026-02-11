import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseAuth';
import adminService from '../lib/supabaseAdmin';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [brandChart, setBrandChart] = useState([]);
  const [serviceChart, setServiceChart] = useState([]);
  const [registrationChart, setRegistrationChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();
  const logoUrl = `${process.env.PUBLIC_URL || ''}/logo.png`;

  useEffect(() => {
    const checkAdmin = async () => {
      const adminUser = localStorage.getItem('adminUser');
      const isAdmin = localStorage.getItem('isAdmin');
      
      if (!adminUser || !isAdmin) {
        navigate('/admin');
        return;
      }

      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        handleLogout();
        return;
      }

      setAdmin(JSON.parse(adminUser));
      loadData();
    };

    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, users, brands, services, registrations] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getBrandChart(),
        adminService.getServiceChart(),
        adminService.getRegistrationChart()
      ]);
      
      setStats(stats);
      setUsers(users);
      setBrandChart(brands);
      setServiceChart(services);
      setRegistrationChart(registrations);
    } catch (err) {
      console.error('Error loading admin data:', err);
      if (err.message?.includes('JWT')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  const getServiceName = (type) => {
    const names = {
      'civil_liability': 'Civil Liability Insurance',
      'vignette': 'Vignette',
      'inspection': 'Technical Inspection',
      'casco': 'CASCO',
      'tax': 'Vehicle Tax',
      'fire_extinguisher': 'Fire Extinguisher Check',
      'repair': 'Repair',
      'maintenance': 'Maintenance',
      'tires': 'Tire Change',
      'refuel': 'Refuel',
      'other': 'Other'
    };
    return names[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOverview = () => (
    <div className="admin-overview">
      <div className="stats-row">
        <div className="admin-stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.totalUsers || 0}</div>
            <div className="stat-label">Total users</div>
          </div>
        </div>
        <div className="admin-stat-card success">
          <div className="stat-icon">🚗</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.totalCars || 0}</div>
            <div className="stat-label">Vehicles</div>
          </div>
        </div>
        <div className="admin-stat-card info">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.totalServices || 0}</div>
            <div className="stat-label">Services</div>
          </div>
        </div>
        <div className="admin-stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.expiringServices || 0}</div>
            <div className="stat-label">Expiring soon</div>
          </div>
        </div>
      </div>

      <div className="stats-row secondary">
        <div className="admin-stat-card small">
          <div className="stat-mini-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.newUsersToday || 0}</div>
            <div className="stat-label">New today</div>
          </div>
        </div>
        <div className="admin-stat-card small">
          <div className="stat-mini-icon">📆</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.newUsersWeek || 0}</div>
            <div className="stat-label">New this week</div>
          </div>
        </div>
        <div className="admin-stat-card small">
          <div className="stat-mini-icon">🗓️</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.newUsersMonth || 0}</div>
            <div className="stat-label">New this month</div>
          </div>
        </div>
        <div className="admin-stat-card small danger">
          <div className="stat-mini-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.expiredServices || 0}</div>
            <div className="stat-label">Expired services</div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>🚘 Top 10 car brands</h3>
          <div className="bar-chart">
            {brandChart.length === 0 ? (
              <p className="no-data">No data</p>
            ) : (
              brandChart.map((item, index) => {
                const maxCount = Math.max(...brandChart.map(b => b.count));
                const width = (item.count / maxCount) * 100;
                return (
                  <div key={index} className="bar-item">
                    <div className="bar-label">{item.brand}</div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: `${width}%` }}>
                        <span className="bar-count">{item.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>📊 Services distribution</h3>
          <div className="service-chart">
            {serviceChart.length === 0 ? (
              <p className="no-data">No data</p>
            ) : (
              serviceChart.map((item, index) => {
                const total = serviceChart.reduce((sum, s) => sum + parseInt(s.count), 0);
                const percent = ((item.count / total) * 100).toFixed(1);
                return (
                  <div key={index} className="service-item">
                    <div className="service-info">
                      <span className="service-name">{getServiceName(item.serviceType)}</span>
                      <span className="service-percent">{percent}%</span>
                    </div>
                    <div className="service-bar">
                      <div 
                        className="service-fill" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="service-count">{item.count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-users">
      <div className="users-header">
        <h3>👥 All users ({users.length})</h3>
        <button className="refresh-btn" onClick={loadData}>🔄 Refresh</button>
      </div>
      
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Registered</th>
              <th>Cars</th>
              <th>Services</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="user-id">#{user.id}</td>
                <td className="user-name">
                  <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  {user.name}
                </td>
                <td className="user-email">{user.email}</td>
                <td className="user-date">{formatDate(user.createdAt)}</td>
                <td className="user-stat">
                  <span className="stat-badge cars">{user.carCount} 🚗</span>
                </td>
                <td className="user-stat">
                  <span className="stat-badge services">{user.serviceCount} 📋</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="admin-activity">
      <h3>📈 Registrations in the last 30 days</h3>
      <div className="activity-chart">
        {registrationChart.length === 0 ? (
          <p className="no-data">No data for this period</p>
        ) : (
          <div className="line-chart">
            {registrationChart.map((item, index) => {
              const maxCount = Math.max(...registrationChart.map(r => r.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <div key={index} className="line-bar">
                  <div 
                    className="line-fill" 
                    style={{ height: `${height}%` }}
                    title={`${item.date}: ${item.count} registrations`}
                  >
                    {item.count > 0 && <span>{item.count}</span>}
                  </div>
                  <div className="line-label">
                    {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <img src={logoUrl} alt="CarGuard logo" className="admin-loading-logo" />
        <div className="spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <img src={logoUrl} alt="CarGuard logo" className="admin-logo" />
          <span className="admin-title">Admin Panel</span>
        </div>

        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            <span>Overview</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            <span>Users</span>
            <span className="nav-badge">{users.length}</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <span className="nav-icon">📈</span>
            <span>Activity</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">👤</div>
            <div className="admin-details">
              <span className="admin-name">{admin?.name}</span>
              <span className="admin-role">Administrator</span>
            </div>
          </div>
          <button className="admin-logout" onClick={handleLogout}>
            🚪 Log out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>
            {activeTab === 'overview' && '📊 Analytics'}
            {activeTab === 'users' && '👥 Users'}
            {activeTab === 'activity' && '📈 Activity'}
          </h1>
          <div className="header-actions">
            <span className="last-update">Last update: {new Date().toLocaleTimeString('en-GB')}</span>
            <button className="refresh-btn" onClick={loadData}>🔄</button>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'activity' && renderActivity()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
