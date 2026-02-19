import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AuthCallback from './pages/AuthCallback';
import VerifyEmail from './pages/VerifyEmail';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/Overview';
import Vehicles from './pages/Vehicles';
import Services from './pages/Services';
import Documents from './pages/Documents';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Dashboard — nested routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="services" element={<Services />} />
            <Route path="documents" element={<Documents />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
