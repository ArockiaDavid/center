import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  Paper,
  Divider,
  Alert
} from '@mui/material';
import { 
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import authService from '../api/authService';
import { installationService } from '../api/installationService';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      setError('');
      console.log('Attempting login with:', { email, role: 'user' });
      
      // Validate email format
      if (!email.endsWith('@piramal.com')) {
        setError('Only @piramal.com email addresses are allowed');
        return;
      }
      
      // Validate password
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      
      // Attempt login
      const response = await authService.login(email, password, 'user');
      console.log('Login successful:', response);
      
      // Verify response data
      if (!response.token || !response.user) {
        throw new Error('Invalid response from server');
      }
      
      // Store auth data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Verify storage
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!storedToken || !storedUser) {
        throw new Error('Failed to store authentication data');
      }
      
      // Navigate to home page
      console.log('Login successful, navigating to home page');
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      // Log the full error object for debugging
      console.log('Full error object:', {
        error,
        message: error.message,
        details: error.details,
        stack: error.stack
      });
      
      if (error.message) {
        setError(error.message);
        if (error.details) {
          console.error('Login Error Details:', error.details);
        }
      } else {
        setError('Failed to login. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" disableGutters>
      <Box className="login-container">
        <Paper className="login-paper" elevation={3}>
          <Box className="login-header">
            <Box className="login-icon-wrapper user">
              <PersonIcon className="login-icon" />
            </Box>
            <Typography component="h1" variant="h4" className="login-title">
              Software Center
            </Typography>
            <Typography variant="subtitle1" className="login-subtitle">
              Sign in to your account
            </Typography>
          </Box>

          <Box component="form" className="login-form" onSubmit={handleSubmit} noValidate>
            <Box className="login-fields">
              <TextField
                className="login-textfield"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!error}
                helperText="Only @piramal.com email addresses are allowed"
              />
              <TextField
                className="login-textfield password"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!error}
              />
            </Box>

            {error && (
              <Alert severity="error" className="login-error">
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              className="login-button"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Box className="login-links">
              <Link 
                component={RouterLink}
                to="/signup" 
                variant="body2"
                className="login-link"
              >
                Create Account
              </Link>
              <Link 
                component={RouterLink}
                to="/forgot-password" 
                variant="body2"
                className="login-link"
              >
                Forgot Password?
              </Link>
            </Box>

            <Divider className="login-divider">
              <Typography variant="body2" className="login-divider-text">
                OR
              </Typography>
            </Divider>

            <Button
              variant="outlined"
              startIcon={<AdminIcon />}
              component={RouterLink}
              to="/admin-login"
              className="admin-button"
            >
              Sign in as Admin
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
