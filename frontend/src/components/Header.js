import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Avatar, Box, Divider, TextField, InputAdornment } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import config from '../config';

const Header = ({ user, onLogout, onSidebarToggle, onSearch }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEditProfile = () => {
    const profilePath = user?.role === 'admin' ? '/admin-profile' : '/profile';
    navigate(profilePath);
    handleClose();
  };

  const handleLogoutClick = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3007/users/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      handleClose();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch?.(value);
  };

  const getAvatarUrl = () => {
    if (user?.avatar) {
      // If avatar is already a full URL, return it
      if (user.avatar.startsWith('http')) {
        return user.avatar;
      }
      // Otherwise, prepend the API base URL
      return `http://localhost:3007${user.avatar}`;
    }
    return null;
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        backgroundColor: config.theme.primaryColor,
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar>
        {user?.role === 'admin' && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate(user?.role === 'admin' ? '/all-user' : '/home')}
        >
          {config.appName}
        </Typography>

        {user && user.role === 'user' && (
          <Box sx={{ 
            mx: 2,
            position: 'relative',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <TextField
              fullWidth={false}
              size="small"
              placeholder="Search software..."
              value={searchValue}
              onChange={handleSearchChange}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchValue ? (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setSearchValue('');
                        onSearch?.('');
                      }}
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main'
                        }
                      }}
                    >
                      ×
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: {
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent'
                  },
                  boxShadow: 1,
                  transition: 'all 0.3s ease-in-out',
                  width: searchValue ? '300px' : '200px',
                  '&:hover': {
                    boxShadow: 2
                  },
                  '&.Mui-focused': {
                    boxShadow: 3,
                    width: '400px'
                  }
                }
              }}
              sx={{
                '& .MuiInputBase-input': {
                  '&::placeholder': {
                    color: 'text.secondary',
                    opacity: 0.8
                  }
                }
              }}
            />
          </Box>
        )}

        {user ? (
          <>
            {config.enableNotifications && (
              <IconButton color="inherit">
                <NotificationsIcon />
              </IconButton>
            )}
            
            <IconButton 
              color="inherit"
              onClick={handleProfileClick}
            >
              {getAvatarUrl() ? (
                <Avatar 
                  src={getAvatarUrl()}
                  alt={user.name}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    border: '2px solid white'
                  }}
                />
              ) : (
                <AccountCircleIcon />
              )}
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email || ''}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleEditProfile}>
                <EditIcon sx={{ mr: 1 }} /> Edit Profile
              </MenuItem>
              <MenuItem onClick={handleLogoutClick}>
                <LogoutIcon sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button 
              color="inherit"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button 
              color="inherit"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </Button>
          </>
        )}

      </Toolbar>
    </AppBar>
  );
};

export default Header;
