import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../lib/supabaseAuth';
import '../styles/Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const formRef = useRef(null);
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

  // Auto-scroll input into view on focus (for mobile/embedded browsers)
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const handleFocus = (e) => {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    };
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => input.addEventListener('focus', handleFocus));
    return () => {
      inputs.forEach(input => input.removeEventListener('focus', handleFocus));
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const result = await register(formData.name, formData.email, formData.password);
      // Check if email confirmation is required
      if (result.emailConfirmationRequired) {
        setError('✅ Registration successful! Please check your email to confirm.');
      } else {
        // Auto login and redirect if no confirmation needed
        navigate('/dashboard');
      }
    } catch (err) {
      // Show more user-friendly error messages for common Supabase errors
      if (err.message && err.message.includes('rate limit')) {
        setError('Too many attempts. Please wait a minute and try again.');
      } else if (err.message && err.message.includes('row-level security')) {
        setError('Registration failed due to a server error. Please contact support.');
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // Supabase redirect will hydrate the session
    } catch (err) {
      setError('Google sign-up failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Sign up</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} ref={formRef}>
          <div className="form-group">
            <label>Name</label>
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
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
        
        <div className="oauth-divider">
          <span>or</span>
        </div>
        
        <button 
          type="button" 
          className="google-btn"
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
        >
          {googleLoading ? 'Signing up with Google...' : '🔐 Sign up with Google'}
        </button>

        <p>
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
