import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Avatar, 
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import config from '../config';

const ProfileForm = ({ 
  name,
  email,
  avatar,
  loading,
  error,
  success,
  onNameChange,
  onEmailChange,
  onAvatarChange,
  onSubmit,
  onCancel
}) => {
  const getAvatarUrl = () => {
    if (avatar) {
      if (avatar.startsWith('data:')) return avatar;
      if (avatar.startsWith('http')) return avatar;
      if (avatar.startsWith('/')) return `${config.apiUrl}${avatar}`;
      return `${config.apiUrl}/uploads/${avatar}`;
    }
    return null;
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={getAvatarUrl()}
            alt={name}
            sx={{
              width: 100,
              height: 100,
              mb: 2,
              border: '2px solid',
              borderColor: 'primary.main'
            }}
          />
          <input
            accept="image/*"
            type="file"
            id="avatar-upload"
            onChange={onAvatarChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="avatar-upload">
            <IconButton
              color="primary"
              component="span"
              sx={{
                position: 'absolute',
                bottom: 16,
                right: -8,
                backgroundColor: 'background.paper',
                boxShadow: 1,
                '&:hover': {
                  backgroundColor: 'background.paper',
                }
              }}
            >
              <PhotoCameraIcon />
            </IconButton>
          </label>
        </Box>

        <TextField
          fullWidth
          label="Name"
          value={name}
          onChange={onNameChange}
          margin="normal"
        />

        <TextField
          fullWidth
          label="Email"
          value={email}
          onChange={onEmailChange}
          margin="normal"
          type="email"
        />

        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Save Changes'
            )}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ProfileForm;
