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
import './LoginPage.css';

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
      // Login
      const response = await authService.login(email, password, 'user');
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Check installed software
      const softwareList = [
        { id: 'sublime-text', command: 'subl' },
        { id: 'visual-studio-code', command: 'code' },
        { id: 'node', command: 'node' },
        { id: 'postman', command: 'postman' },
        { id: 'docker', command: 'docker' },
        { id: 'google-chrome', command: 'google-chrome' }
      ];

      // Check each software
      for (const software of softwareList) {
        try {
          const { exists, version } = await installationService.checkCommand(software.command);
          if (exists) {
            await installationService.installSoftware({
              id: software.id,
              name: software.id,
              version: version
            });
          }
        } catch (error) {
          console.error(`Error checking ${software.id}:`, error);
        }
      }

      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Error logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
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

          <Box component="form" className="login-form" onSubmit={handleSubmit}>
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
