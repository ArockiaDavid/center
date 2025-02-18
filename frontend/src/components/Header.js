import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Avatar, Box, Divider, TextField, InputAdornment } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import config from '../config';
import '../styles/Header.css';

const Header = ({ user, onLogout, onSidebarToggle, onSearch }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
      await fetch(`${config.apiUrl}/users/logout`, {
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
      if (user.avatar.startsWith('data:') || user.avatar.startsWith('http')) {
        return user.avatar;
      }
      return `${config.apiUrl}${user.avatar}`;
    }
    return null;
  };

  return (
    <AppBar 
      position="fixed" 
      className="header-app-bar"
      style={{ backgroundColor: config.theme.primaryColor }}
    >
      <Toolbar>
        {user?.role === 'admin' && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onSidebarToggle}
            className="header-menu-button"
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography 
          variant="h6" 
          component="div" 
          className="header-title"
          onClick={() => navigate(user?.role === 'admin' ? '/all-user' : '/home')}
        >
          {config.appName}
        </Typography>

        {user && user.role === 'user' && (
          <div className="header-search-container">
            <TextField
              size="small"
              placeholder="Search software..."
              value={searchValue}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className={`header-search-input ${isSearchFocused ? 'focused' : ''} ${searchValue ? 'has-value' : ''}`}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
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
                      className="header-clear-button"
                    >
                      ×
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
          </div>
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
                  className="header-avatar"
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
              PaperProps={{
                elevation: 0,
                className: 'header-menu-paper'
              }}
            >
              <Box className="header-user-info">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  {getAvatarUrl() ? (
                    <Avatar 
                      src={getAvatarUrl()}
                      alt={user?.name}
                      className="header-avatar"
                    />
                  ) : (
                    <AccountCircleIcon sx={{ width: 48, height: 48, color: 'rgba(255, 255, 255, 0.9)' }} />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography className="header-user-name">
                      {user?.name || 'User'}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}>
                      <Typography className="header-user-email">
                        {user?.email || ''}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ p: 1 }}>
                <MenuItem 
                  onClick={handleEditProfile}
                  className="header-menu-item"
                >
                  <EditIcon className="header-menu-item-icon" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>Edit Profile</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Update your profile information
                    </Typography>
                  </Box>
                </MenuItem>
                {config.enableNotifications && (
                  <MenuItem 
                    className="header-menu-item"
                    onClick={handleClose}
                  >
                    <NotificationsIcon className="header-menu-item-icon" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>Notifications</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        View your notifications
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
              </Box>
              <MenuItem 
                onClick={handleLogoutClick}
                className="header-menu-item logout"
              >
                <LogoutIcon className="header-menu-item-icon" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>Logout</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Sign out of your account
                  </Typography>
                </Box>
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
