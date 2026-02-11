import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../lib/supabaseAuth';
import '../styles/Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await register(formData.name, formData.email, formData.password);
      
      // Check if email confirmation is required
      if (result.emailConfirmationRequired) {
        setError('✅ Регистрацията е успешна! Моля проверете имейла си за потвърждение.');
      } else {
        // Auto login and redirect if no confirmation needed
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // Supabase redirect ще попълни сессията
    } catch (err) {
      setError('Google sign-up failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Регистрация</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Име</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароля</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Регистриране...' : 'Регистрирай се'}
          </button>
        </form>
        
        <div className="oauth-divider">
          <span>или</span>
        </div>
        
        <button 
          type="button" 
          className="google-btn"
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
        >
          {googleLoading ? 'Регистриране с Google...' : '🔐 Регистрирай се с Google'}
        </button>

        <p>
          Вече имаш акаунт? <a href="/login">Влез в системата</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
