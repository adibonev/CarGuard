import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

  const api = axios.create({
    baseURL: 'http://localhost:5000/api/admin',
    headers: {
      'x-admin-token': localStorage.getItem('adminToken')
    }
  });

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser || !localStorage.getItem('adminToken')) {
      navigate('/admin');
      return;
    }
    setAdmin(JSON.parse(adminUser));
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, brandsRes, servicesRes, regsRes] = await Promise.all([
        api.get('/stats'),
        api.get('/users'),
        api.get('/chart/brands'),
        api.get('/chart/services'),
        api.get('/chart/registrations')
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setBrandChart(brandsRes.data);
      setServiceChart(servicesRes.data);
      setRegistrationChart(regsRes.data);
    } catch (err) {
      console.error('Error loading admin data:', err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  const getServiceName = (type) => {
    const names = {
      'гражданска': 'Гражданска отговорност',
      'винетка': 'Винетка',
      'преглед': 'Технически преглед',
      'каско': 'КАСКО',
      'данък': 'Данък МПС',
      'ремонт': 'Ремонт',
      'обслужване': 'Обслужване',
      'гуми': 'Смяна гуми',
      'зареждане': 'Зареждане',
      'друго': 'Друго'
    };
    return names[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('bg-BG', {
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
            <div className="stat-label">Общо потребители</div>
          </div>
        </div>
        <div className="admin-stat-card success">
          <div className="stat-icon">🚗</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.totalCars || 0}</div>
            <div className="stat-label">Автомобили</div>
          </div>
        </div>
        <div className="admin-stat-card info">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.totalServices || 0}</div>
            <div className="stat-label">Услуги</div>
          </div>
        </div>
        <div className="admin-stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.expiringServices || 0}</div>
            <div className="stat-label">Изтичащи скоро</div>
          </div>
        </div>
      </div>

      <div className="stats-row secondary">
        <div className="admin-stat-card small">
          <div className="stat-mini-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.newUsersToday || 0}</div>
            <div className="stat-label">Нови днес</div>
          </div>
        </div>
        <div className="admin-stat-card small">
          <div className="stat-mini-icon">📆</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.newUsersWeek || 0}</div>
            <div className="stat-label">Нови тази седмица</div>
          </div>
        </div>
        <div className="admin-stat-card small">
          <div className="stat-mini-icon">🗓️</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.newUsersMonth || 0}</div>
            <div className="stat-label">Нови този месец</div>
          </div>
        </div>
        <div className="admin-stat-card small danger">
          <div className="stat-mini-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.expiredServices || 0}</div>
            <div className="stat-label">Изтекли услуги</div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>🚘 Топ 10 марки автомобили</h3>
          <div className="bar-chart">
            {brandChart.length === 0 ? (
              <p className="no-data">Няма данни</p>
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
          <h3>📊 Разпределение на услугите</h3>
          <div className="service-chart">
            {serviceChart.length === 0 ? (
              <p className="no-data">Няма данни</p>
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
        <h3>👥 Всички потребители ({users.length})</h3>
        <button className="refresh-btn" onClick={loadData}>🔄 Обнови</button>
      </div>
      
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Име</th>
              <th>Email</th>
              <th>Регистриран</th>
              <th>Коли</th>
              <th>Услуги</th>
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
      <h3>📈 Регистрации през последните 30 дни</h3>
      <div className="activity-chart">
        {registrationChart.length === 0 ? (
          <p className="no-data">Няма данни за периода</p>
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
                    title={`${item.date}: ${item.count} регистрации`}
                  >
                    {item.count > 0 && <span>{item.count}</span>}
                  </div>
                  <div className="line-label">
                    {new Date(item.date).toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit' })}
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
        <div className="spinner"></div>
        <p>Зареждане на данни...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-logo">🛡️</span>
          <span className="admin-title">Admin Panel</span>
        </div>

        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            <span>Преглед</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            <span>Потребители</span>
            <span className="nav-badge">{users.length}</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <span className="nav-icon">📈</span>
            <span>Активност</span>
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
            🚪 Изход
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>
            {activeTab === 'overview' && '📊 Статистика'}
            {activeTab === 'users' && '👥 Потребители'}
            {activeTab === 'activity' && '📈 Активност'}
          </h1>
          <div className="header-actions">
            <span className="last-update">Последно обновяване: {new Date().toLocaleTimeString('bg-BG')}</span>
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
