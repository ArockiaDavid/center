import React, { useState, useEffect } from 'react';
import { Container, Box, IconButton, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ProfileForm from './ProfileForm';
import config from '../config';

const AdminProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        navigate('/login');
        return;
      }
      setUser(parsedUser);
      setName(parsedUser.name || '');
      setEmail(parsedUser.email || '');
      setAvatar(parsedUser.avatar || null);
    }
  }, [navigate]);

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        setError('');
      };
      reader.onerror = () => {
        setError('Error reading file');
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => setError('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('role', 'admin');

      if (avatar && avatar.startsWith('data:image')) {
        const response = await fetch(avatar);
        const blob = await response.blob();
        formData.append('avatar', blob, 'avatar.jpg');
      }

      const response = await fetch(`${config.apiUrl}/admin/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      const updatedUser = { 
        ...user, 
        name, 
        email, 
        avatar: data.avatar,
        role: 'admin'
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setAvatar(data.avatar);

      window.dispatchEvent(new CustomEvent('userUpdated', { 
        detail: updatedUser 
      }));
      setSuccess('Profile updated successfully');
      
      setTimeout(() => {
        window.location.replace('/admin-dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2, 
        bgcolor: 'primary.main', 
        color: 'white',
        boxShadow: 1
      }}>
        <IconButton 
          color="inherit" 
          onClick={() => navigate('/all-user')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">
          Edit Admin Profile
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <ProfileForm
          name={name}
          email={email}
          avatar={avatar}
          loading={loading}
          error={error}
          success={success}
          onNameChange={(e) => setName(e.target.value)}
          onEmailChange={(e) => setEmail(e.target.value)}
          onAvatarChange={handleAvatarChange}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/all-user')}
        />
      </Container>
    </Box>
  );
};

export default AdminProfile;
