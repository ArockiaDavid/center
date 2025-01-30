import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import authService from '../api/authService';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const validateName = (name) => {
    if (!name) {
      setValidationErrors(prev => ({ ...prev, name: 'Name is required' }));
      return false;
    }
    setValidationErrors(prev => ({ ...prev, name: '' }));
    return true;
  };

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

  const validatePassword = (password) => {
    if (!password) {
      setValidationErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    if (password.length < 6) {
      setValidationErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
      return false;
    }
    setValidationErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      return false;
    }
    if (confirmPassword !== formData.password) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return false;
    }
    setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
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
      case 'name':
        validateName(value);
        break;
      case 'email':
        validateEmail(value);
        break;
      case 'password':
        validatePassword(value);
        break;
      case 'confirmPassword':
        validateConfirmPassword(value);
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
    const isNameValid = validateName(formData.name);
    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password);
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    try {
      await authService.signup({ 
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      setSuccess('Account created successfully');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create account');
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
            Create your account
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 4,
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            to continue to Software Center
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
              <InputLabel id="role-label">Sign up as</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Sign up as"
                onChange={handleChange}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              id="name"
              label="Name"
              name="name"
              autoComplete="off"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
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
              id="email"
              label="Email Address"
              name="email"
              autoComplete="off"
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
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="off"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
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
              label="Confirm Password"
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
                href="/login" 
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
                Sign in instead
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
                Create account
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignupPage;
