import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Link,
  Paper,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import authService from '../api/authService';
import '../styles/ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
    role: ''
  });
  const navigate = useNavigate();

  const validateEmail = (email) => {
    if (!email) {
      setValidationErrors(prev => ({ ...prev, email: 'Email is required' }));
      return false;
    }
    if (!email.endsWith('@piramal.com')) {
      setValidationErrors(prev => ({ ...prev, email: 'Only piramal.com email addresses are allowed' }));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationErrors(prev => ({ ...prev, email: 'Invalid email format' }));
      return false;
    }
    setValidationErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validateNewPassword = (password) => {
    if (!password) {
      setValidationErrors(prev => ({ ...prev, newPassword: 'Password is required' }));
      return false;
    }
    if (password.length < 6) {
      setValidationErrors(prev => ({ ...prev, newPassword: 'Password must be at least 6 characters' }));
      return false;
    }
    setValidationErrors(prev => ({ ...prev, newPassword: '' }));
    return true;
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      return false;
    }
    if (confirmPassword !== formData.newPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return false;
    }
    setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
    return true;
  };

  const validateRole = (role) => {
    if (!role) {
      setValidationErrors(prev => ({ ...prev, role: 'Role is required' }));
      return false;
    }
    setValidationErrors(prev => ({ ...prev, role: '' }));
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'email':
        validateEmail(value);
        break;
      case 'newPassword':
        validateNewPassword(value);
        break;
      case 'confirmPassword':
        validateConfirmPassword(value);
        break;
      case 'role':
        validateRole(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate all fields
    const isEmailValid = validateEmail(formData.email);
    const isNewPasswordValid = validateNewPassword(formData.newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword);
    const isRoleValid = validateRole(formData.role);

    if (!isEmailValid || !isNewPasswordValid || !isConfirmPasswordValid || !isRoleValid) {
      return;
    }

    try {
      await authService.forgotPassword(formData.email, formData.newPassword, formData.role);
      setSuccess('Password has been reset successfully');
      setTimeout(() => {
        navigate(formData.role === 'admin' ? '/admin-login' : '/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box className="forgot-password-container">
        <Paper className="forgot-password-paper" elevation={2}>
          <Typography component="h1" variant="h5" className="forgot-password-title">
            Reset password
          </Typography>
          <Typography variant="body1" className="forgot-password-subtitle">
            Enter your email and new password
          </Typography>
          
          {error && (
            <Alert severity="error" variant="outlined" className="forgot-password-alert error">
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" variant="outlined" className="forgot-password-alert success">
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <FormControl 
              fullWidth 
              className="forgot-password-form-control"
              error={!!validationErrors.role}
            >
              <InputLabel id="role-label">Reset password as</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Reset password as"
                onChange={handleChange}
                onBlur={handleBlur}
                className="forgot-password-input"
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <TextField
              className="forgot-password-input"
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="off"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
            />

            <TextField
              className="forgot-password-input"
              margin="normal"
              fullWidth
              name="newPassword"
              label="New Password"
              type="password"
              id="newPassword"
              autoComplete="off"
              value={formData.newPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!validationErrors.newPassword}
              helperText={validationErrors.newPassword}
            />

            <TextField
              className="forgot-password-input"
              margin="normal"
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              autoComplete="off"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!validationErrors.confirmPassword}
              helperText={validationErrors.confirmPassword}
            />

            <Box className="forgot-password-actions">
              <Link 
                href={formData.role === 'admin' ? '/admin-login' : '/login'}
                className="forgot-password-back-link"
              >
                Back to Sign in
              </Link>
              <Button
                type="submit"
                variant="contained"
                className="forgot-password-submit"
              >
                Reset password
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;
