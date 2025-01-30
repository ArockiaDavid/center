import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
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
import ProfilePage from './pages/ProfilePage';
import AdminProfilePage from './pages/AdminProfilePage';
import './styles/variables.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return <Navigate to="/admin-login" />;
  }
  
  try {
    const userData = JSON.parse(user);
    if (userData.role !== 'admin') {
      return <Navigate to="/admin-login" />;
    }
  } catch (err) {
    return <Navigate to="/admin-login" />;
  }
  
  return children;
};

const App = () => {
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
          <Route path="/profile" element={<ProfilePage />} />
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
