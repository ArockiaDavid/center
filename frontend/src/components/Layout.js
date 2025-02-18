import React, { useState, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import authService from '../api/authService';
import Header from './Header';
import Sidebar from './Sidebar';
import LogoutWarning from './LogoutWarning';
import useAutoLogout from '../hooks/useAutoLogout';

const HEADER_HEIGHT = 64;
const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 65;

const Layout = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => {
    const savedState = localStorage.getItem('sidebarExpanded');
    return savedState === null ? true : savedState === 'true';
  });
  const [user, setUser] = useState(authService.getCurrentUser());

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  // Update user state when auth changes
  useEffect(() => {
    const checkAuth = () => {
      if (!authService.isAuthenticated()) {
        navigate('/login', { replace: true });
        return;
      }
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    };

    checkAuth();
    // Check auth status periodically
    const interval = setInterval(checkAuth, 60000); // every minute
    return () => clearInterval(interval);
  }, [navigate]);

  const { showWarning, remainingTime, onStayLoggedIn } = useAutoLogout(handleLogout);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleSidebarExpand = (value) => {
    setExpanded(value);
    localStorage.setItem('sidebarExpanded', value);
  };

  // Handle click outside to collapse sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside sidebar and header
      if (!event.target.closest('.sidebar') && !event.target.closest('.header-app-bar')) {
        setExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      handleSidebarClose();
    }
  }, [location.pathname]);

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      bgcolor: 'grey.50',
      overflow: 'hidden'
    }}>
      <Header 
        user={user}
        onLogout={handleLogout}
        onSidebarToggle={handleSidebarToggle}
      />
      {user?.role === 'admin' && (
        <Sidebar
          open={sidebarOpen}
          expanded={expanded}
          onExpand={handleSidebarExpand}
          onClose={handleSidebarClose}
        />
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          width: '100%',
          marginTop: `${HEADER_HEIGHT}px`,
          marginLeft: user?.role === 'admin' ? 
            (expanded ? `${DRAWER_WIDTH}px` : `${COLLAPSED_WIDTH}px`) : 0,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.easeOut,
            duration: 200,
          }),
          overflow: 'auto'
        }}
      >
        <Box
          sx={{
            minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <LogoutWarning 
        open={showWarning}
        onStayLoggedIn={onStayLoggedIn}
        onLogout={handleLogout}
        remainingTime={remainingTime}
      />
    </Box>
  );
};

export default Layout;
