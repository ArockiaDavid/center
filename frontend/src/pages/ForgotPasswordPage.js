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
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '80vh',
          justifyContent: 'center'
        }}
      >
        <Paper 
          elevation={2} 
          sx={{ 
            p: { xs: 3, sm: 6 }, 
            width: '100%',
            maxWidth: '450px',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography 
            component="h1" 
            variant="h5" 
            sx={{ 
              fontWeight: 400,
              mb: 1,
              textAlign: 'center'
            }}
          >
            Reset password
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 4,
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            Enter your email and new password
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 1,
                '& .MuiAlert-message': {
                  color: '#d32f2f'
                }
              }}
              variant="outlined"
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                borderRadius: 1,
                '& .MuiAlert-message': {
                  color: '#2e7d32'
                }
              }}
              variant="outlined"
            >
              {success}
            </Alert>
          )}

          <Box 
            component="form" 
            onSubmit={handleSubmit}
          >
            <FormControl 
              fullWidth 
              margin="normal"
              error={!!validationErrors.role}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                  '&:hover fieldset': {
                    borderColor: 'text.primary',
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: '2px',
                    borderColor: '#1a73e8',
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#1a73e8',
                }
              }}
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
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                  '&:hover fieldset': {
                    borderColor: 'text.primary',
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: '2px',
                    borderColor: '#1a73e8',
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#1a73e8',
                }
              }}
            />
            <TextField
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                  '&:hover fieldset': {
                    borderColor: 'text.primary',
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: '2px',
                    borderColor: '#1a73e8',
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#1a73e8',
                }
              }}
            />
            <TextField
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                  '&:hover fieldset': {
                    borderColor: 'text.primary',
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: '2px',
                    borderColor: '#1a73e8',
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#1a73e8',
                }
              }}
            />
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 4
            }}>
              <Link 
                href={formData.role === 'admin' ? '/admin-login' : '/login'}
                sx={{
                  color: '#1a73e8',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Back to Sign in
              </Link>
              <Button
                type="submit"
                variant="contained"
                sx={{ 
                  px: 4,
                  py: 1,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  backgroundColor: '#1a73e8',
                  '&:hover': {
                    backgroundColor: '#1557b0',
                  }
                }}
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
