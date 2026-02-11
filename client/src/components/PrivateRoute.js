import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { session, loading } = useAuth();

  // Wait for app initialization before redirecting
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return children;
};
export default PrivateRoute;