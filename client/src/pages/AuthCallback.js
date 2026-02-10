import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseAuth';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          setError('No session found. Please try signing in again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        const user = session.user;

        // Create or update user in your database
        const response = await fetch('/api/auth/google-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            googleId: user.id,
            emailVerified: user.email_confirmed_at !== null
          })
        });

        if (!response.ok) {
          throw new Error('Failed to process Google sign-in');
        }

        const data = await response.json();
        login(data.user, data.token);
        navigate('/dashboard');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate, login]);

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{loading ? 'Обработване...' : 'Грешка'}</h2>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#666' }}>
            Вашата сесия се обработва... Моля, изчакайте.
          </p>
        ) : (
          <>
            <div className="error-message">{error}</div>
            <p style={{ textAlign: 'center', color: '#666' }}>
              Редиректиране към логване... ако не се редиректира, <a href="/login">кликнете тук</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
