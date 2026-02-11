import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseAuth';
import '../styles/AdminLogin.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting admin login with:', { email: formData.email });
      
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (userError) throw userError;

      // Check if user is admin
      if (!userData.is_admin) {
        await supabase.auth.signOut();
        throw new Error('Нямате администраторски права');
      }

      console.log('Admin login successful:', userData);
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminUser', JSON.stringify(userData));
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.message || 'Грешка при вход';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <span className="admin-icon">🔐</span>
          <h1>Admin Portal</h1>
          <p>CarGuard Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && <div className="admin-error">{error}</div>}
          
          <div className="admin-form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter admin email"
              required
              autoComplete="email"
            />
          </div>

          <div className="admin-form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </button>
        </form>

        <div className="admin-login-footer">
          <a href="/">← Back to CarGuard</a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
