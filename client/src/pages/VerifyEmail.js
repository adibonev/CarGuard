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
            <h2>Верификация на имейл</h2>
            <p style={{ textAlign: 'center', color: '#666' }}>
              Вашият имейл се верифицира... Моля, изчакайте.
            </p>
          </>
        ) : success ? (
          <>
            <h2>✅ Успех!</h2>
            <p style={{ textAlign: 'center', color: '#28a745', marginTop: '20px' }}>
              Вашият имейл е успешно верифициран.
            </p>
            <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
              Редиректиране към логване... ако не се редиректира, <a href="/login">кликнете тук</a>
            </p>
          </>
        ) : (
          <>
            <h2>❌ Грешка</h2>
            <div className="error-message">{error}</div>
            <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
              <a href="/login">Върнете се към логване</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
