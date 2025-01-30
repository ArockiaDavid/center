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
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import authService from '../api/authService';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
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
      const response = await authService.login(email, password, 'admin');
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Error logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box className="admin-login-container">
        <Paper className="admin-login-paper" elevation={3}>
          <Box className="admin-login-header">
            <Box className="admin-login-icon-wrapper">
              <AdminIcon className="admin-login-icon" />
            </Box>
            <Typography component="h1" variant="h4" className="admin-login-title">
              Admin Portal
            </Typography>
            <Typography variant="subtitle1" className="admin-login-subtitle">
              Sign in to admin dashboard
            </Typography>
          </Box>

          <Box component="form" className="admin-login-form" onSubmit={handleSubmit}>
            <TextField
              className="admin-login-textfield"
              required
              fullWidth
              id="email"
              label="Admin Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!error}
              helperText="Only authorized admin emails are allowed"
            />
            <TextField
              className="admin-login-textfield password"
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

            {error && (
              <Alert severity="error" className="admin-login-error">
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="secondary"
              disabled={loading}
              className="admin-login-button"
            >
              {loading ? 'Signing in...' : 'Sign In as Admin'}
            </Button>

            <Box className="admin-login-links">
              <Link 
                component={RouterLink}
                to="/forgot-password" 
                variant="body2"
                className="admin-login-link"
              >
                Forgot Password?
              </Link>
            </Box>

            <Divider className="admin-login-divider">
              <Typography variant="body2" className="admin-login-divider-text">
                OR
              </Typography>
            </Divider>

            <Button
              variant="outlined"
              startIcon={<PersonIcon />}
              component={RouterLink}
              to="/login"
              className="user-button"
            >
              Sign in as User
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLoginPage;
