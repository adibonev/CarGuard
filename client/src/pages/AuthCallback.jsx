import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseAuth';
import '../styles/Auth.css';

const AuthCallback = () => {
  const navigate = useNavigate();
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

        const authUser = session.user;

        // Check if user profile exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .single();

        if (!existingUser) {
          // Create user profile for Google sign-in
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
              email: authUser.email.toLowerCase(),
              auth_user_id: authUser.id,
              reminder_days: 30,
              reminder_enabled: true,
              email_verified: authUser.email_confirmed_at !== null,
              google_id: authUser.id
            })
            .select()
            .single();

          if (createError) throw createError;

          // Create account record
          await supabase.from('accounts').insert({
            user_id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: null
          });
        }

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
  }, [navigate]);

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{loading ? 'Processing...' : 'Error'}</h2>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#666' }}>
            Your session is being processed... Please wait.
          </p>
        ) : (
          <>
            <div className="error-message">{error}</div>
            <p style={{ textAlign: 'center', color: '#666' }}>
              Redirecting to login... if it doesn’t redirect, <a href="/login">click here</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
