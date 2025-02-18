import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  Grid,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import config from '../config';
import {
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Engineering as EngineerIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  Computer as ComputerIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Architecture as ArchitectureIcon,
  Dns as DnsIcon,
  Terminal as TerminalIcon,
  Update as UpdateIcon
} from '@mui/icons-material';

const getRoleIcon = (role) => {
  switch (role) {
    case 'admin':
      return <AdminIcon />;
    case 'engineer':
      return <EngineerIcon />;
    default:
      return <PersonIcon />;
  }
};

const getRoleColor = (role) => {
  switch (role) {
    case 'admin':
      return '#0088FE';
    case 'engineer':
      return '#00C49F';
    default:
      return '#FFBB28';
  }
};

const StatCard = ({ icon: Icon, title, value, color }) => (
  <Card 
    sx={{ 
      height: '100%',
      borderRadius: 2,
      boxShadow: 1,
      '&:hover': {
        boxShadow: 3
      }
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Icon sx={{ color, mr: 1 }} />
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h6" component="div" sx={{ color }}>
        {value || 'Not Available'}
      </Typography>
    </CardContent>
  </Card>
);

const UserDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        navigate('/login');
        return;
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.apiUrl}/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const data = await response.json();
        console.log('User details:', data);
        setUserDetails(data);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setError('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const handleBack = () => {
    navigate('/all-user');
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {error ? (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          ) : userDetails && (
            <>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={handleBack} sx={{ mr: 2 }}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" component="h2" sx={{ flex: 1, fontWeight: 600, color: 'primary.main' }}>
                  User Details
                </Typography>
              </Box>

              {/* User Profile Card */}
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3,
                  borderRadius: 2,
                  boxShadow: 1,
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                  <Avatar
                    src={userDetails.avatar ? (userDetails.avatar.startsWith('data:') ? userDetails.avatar : userDetails.avatar.startsWith('http') ? userDetails.avatar : `${config.apiUrl}${userDetails.avatar}`) : undefined}
                    alt={userDetails.name}
                    sx={{ 
                      width: 100, 
                      height: 100,
                      mr: 3,
                      border: `3px solid ${getRoleColor(userDetails.role)}`,
                      bgcolor: `${getRoleColor(userDetails.role)}40`
                    }}
                  >
                    {userDetails.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" gutterBottom>
                      {userDetails.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1" color="text.secondary">
                        {userDetails.email}
                      </Typography>
                    </Box>
                    <Chip
                      icon={getRoleIcon(userDetails.role)}
                      label={userDetails.role.charAt(0).toUpperCase() + userDetails.role.slice(1)}
                      sx={{
                        backgroundColor: `${getRoleColor(userDetails.role)}20`,
                        color: getRoleColor(userDetails.role),
                        '& .MuiChip-icon': {
                          color: getRoleColor(userDetails.role)
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Paper>

              {/* System Configuration */}
              {userDetails.systemConfig ? (
                <Paper 
                  sx={{ 
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    boxShadow: 1,
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                    System Configuration
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard
                        icon={ComputerIcon}
                        title="Operating System"
                        value={userDetails.systemConfig.osName && userDetails.systemConfig.osVersion ? 
                          `${userDetails.systemConfig.osName} ${userDetails.systemConfig.osVersion}` : 
                          'Not Available'}
                        color={theme.palette.primary.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard
                        icon={MemoryIcon}
                        title="Memory"
                        value={userDetails.systemConfig.totalMemory ? 
                          `${userDetails.systemConfig.freeMemory}GB / ${userDetails.systemConfig.totalMemory}GB` : 
                          'Not Available'}
                        color={theme.palette.success.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard
                        icon={StorageIcon}
                        title="Storage"
                        value={userDetails.systemConfig.totalDiskSpace ? 
                          `${userDetails.systemConfig.freeDiskSpace}GB / ${userDetails.systemConfig.totalDiskSpace}GB` : 
                          'Not Available'}
                        color={theme.palette.warning.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard
                        icon={SpeedIcon}
                        title="CPU"
                        value={userDetails.systemConfig.cpuModel ? 
                          `${userDetails.systemConfig.cpuModel} (${userDetails.systemConfig.cpuCores} cores)` : 
                          'Not Available'}
                        color={theme.palette.info.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard
                        icon={ArchitectureIcon}
                        title="Architecture"
                        value={userDetails.systemConfig.architecture || 'Not Available'}
                        color={theme.palette.primary.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard
                        icon={DnsIcon}
                        title="Hostname"
                        value={userDetails.systemConfig.hostname || 'Not Available'}
                        color={theme.palette.success.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard
                        icon={TerminalIcon}
                        title="Platform"
                        value={userDetails.systemConfig.platform || 'Not Available'}
                        color={theme.palette.warning.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard
                        icon={UpdateIcon}
                        title="Last Updated"
                        value={userDetails.systemConfig.lastUpdated ? 
                          new Date(userDetails.systemConfig.lastUpdated).toLocaleDateString() : 
                          'Not Available'}
                        color={theme.palette.info.main}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ) : (
                <Paper 
                  sx={{ 
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    boxShadow: 1
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    System Configuration
                  </Typography>
                  <Alert severity="info">No system configuration data available</Alert>
                </Paper>
              )}

              {/* Installed Software */}
              {userDetails.installedSoftware && userDetails.installedSoftware.length > 0 ? (
                <Paper 
                  sx={{ 
                    p: 3,
                    borderRadius: 2,
                    boxShadow: 1,
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                    Installed Software
                  </Typography>
                  <Grid container spacing={2}>
                    {userDetails.installedSoftware.map((software) => (
                      <Grid item xs={12} sm={6} md={4} key={software._id}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            borderRadius: 2,
                            boxShadow: 1,
                            '&:hover': {
                              boxShadow: 3
                            }
                          }}
                        >
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {software.name}
                            </Typography>
                            <Typography color="text.secondary" gutterBottom>
                              Version: {software.version}
                            </Typography>
                            <Chip
                              label={software.status}
                              color={software.status === 'installed' ? 'success' : 'default'}
                              size="small"
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              ) : (
                <Paper 
                  sx={{ 
                    p: 3,
                    borderRadius: 2,
                    boxShadow: 1
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Installed Software
                  </Typography>
                  <Alert severity="info">No installed software data available</Alert>
                </Paper>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserDetailsPage;
