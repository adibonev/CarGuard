import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const email = searchParams.get('email');

        if (!email) {
          setError('Email parameter missing');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.msg || 'Verification failed');
        }

        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        console.error('Email verification error:', err);
        setError(err.message || 'Verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-box">
        {loading ? (
          <>
            <h2>Email Verification</h2>
            <p style={{ textAlign: 'center', color: '#666' }}>
              Your email is being verified... Please wait.
            </p>
          </>
        ) : success ? (
          <>
            <h2>✅ Success!</h2>
            <p style={{ textAlign: 'center', color: '#28a745', marginTop: '20px' }}>
              Your email has been verified successfully.
            </p>
            <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
              Redirecting to login... if it doesn’t redirect, <a href="/login">click here</a>
            </p>
          </>
        ) : (
          <>
            <h2>❌ Error</h2>
            <div className="error-message">{error}</div>
            <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
              <a href="/login">Back to login</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
