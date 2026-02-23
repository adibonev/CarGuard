import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, sendVerificationEmail } from '../lib/supabaseAuth';
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
  const [rateLimitedEmail, setRateLimitedEmail] = useState('');
  const [resending, setResending] = useState(false);
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
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('over_email_send_rate_limit') || msg.includes('email rate limit') || msg.includes('rate limit')) {
        setRateLimitedEmail(formData.email);
        setError('Your account was created, but the confirmation email could not be sent due to a rate limit. Please click "Resend" below or try again in a few minutes.');
      } else if (msg.includes('user already registered') || msg.includes('already been registered')) {
        setError('An account with this email already exists. Please log in instead.');
      } else if (msg.includes('row-level security') || msg.includes('violates row-level')) {
        setError('Account created! Please check your email to confirm your registration.');
      } else if (msg.includes('weak_password') || msg.includes('password should')) {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
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
        {error && (
          <div className={error.startsWith('✅') ? 'success-message' : 'error-message'}>
            {error}
            {rateLimitedEmail && (
              <button
                type="button"
                className="resend-btn"
                disabled={resending}
                onClick={async () => {
                  setResending(true);
                  try {
                    await sendVerificationEmail(rateLimitedEmail);
                    setError('✅ Confirmation email sent! Please check your inbox.');
                    setRateLimitedEmail('');
                  } catch (e) {
                    const m = (e.message || '').toLowerCase();
                    if (m.includes('rate limit')) {
                      setError('Still rate limited. Please wait a few minutes and try again.');
                    } else {
                      setError('Could not resend email. Please try again later.');
                    }
                  } finally {
                    setResending(false);
                  }
                }}
              >
                {resending ? 'Sending...' : '📧 Resend confirmation email'}
              </button>
            )}
          </div>
        )}
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
