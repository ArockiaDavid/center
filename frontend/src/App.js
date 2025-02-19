import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import authService from './api/authService';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import AlluserDetails from './pages/AlluserDetails';
import UserDetailsPage from './pages/UserDetailsPage';
import ApplicationManagement from './pages/ApplicationManagement';
import UserProfilePage from './pages/UserProfilePage';
import AdminProfilePage from './pages/NewAdminProfilePage';
import './styles/variables.css';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  
  console.log('PrivateRoute check:', {
    isAuthenticated,
    currentUser
  });
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }
  
  if (!currentUser || currentUser.role !== 'user') {
    console.log('Invalid user role:', currentUser?.role);
    authService.logout();
    return <Navigate to="/login" />;
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  
  console.log('AdminRoute check:', {
    isAuthenticated,
    currentUser
  });
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to admin login');
    return <Navigate to="/admin-login" />;
  }
  
  if (!currentUser || currentUser.role !== 'admin') {
    console.log('Invalid admin role:', currentUser?.role);
    authService.logout();
    return <Navigate to="/admin-login" />;
  }
  
  return children;
};

const App = () => {
  // Check token on app load and setup refresh interval
  useEffect(() => {
    const checkToken = () => {
      if (!authService.isAuthenticated()) {
        return;
      }

      // Get token data
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = tokenData.exp * 1000;
        const currentTime = Date.now();
        const timeToExpiry = expiryTime - currentTime;
        
        console.log('Token status:', {
          expiryTime: new Date(expiryTime).toLocaleString(),
          currentTime: new Date(currentTime).toLocaleString(),
          timeToExpiry: Math.round(timeToExpiry / 1000 / 60) + ' minutes'
        });

        // If token is expired or will expire in next 5 minutes, logout
        if (timeToExpiry < 5 * 60 * 1000) {
          console.log('Token expired or expiring soon, logging out');
          authService.logout();
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Error checking token:', err);
        authService.logout();
        window.location.href = '/login';
      }
    };

    // Check token immediately and every minute
    checkToken();
    const interval = setInterval(checkToken, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* User Routes */}
        <Route element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/" element={<Navigate to="/home" />} />
        </Route>

        {/* Admin Routes */}
        <Route element={
          <AdminRoute>
            <Layout />
          </AdminRoute>
        }>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/all-user" element={<AlluserDetails />} />
          <Route path="/user-details/:id" element={<UserDetailsPage />} />
          <Route path="/application-management" element={<ApplicationManagement />} />
          <Route path="/admin-profile" element={<AdminProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
