import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAutoLogout from '../hooks/useAutoLogout';
import { installationService } from '../api/installationService';
import authService from '../api/authService';
import { 
  Grid, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Snackbar,
  Alert
} from '@mui/material';
import Header from '../components/Header';
import { 
  Code as CodeIcon,
  Language as LanguageIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import AppCard from '../components/AppCard';
import LogoutWarning from '../components/LogoutWarning';
import '../styles/HomePage.css';

const categories = [
  { id: 'all', name: 'All Software', icon: <BuildIcon /> },
  { id: 'development', name: 'Development', icon: <CodeIcon /> },
  { id: 'internet', name: 'Internet', icon: <LanguageIcon /> }
];

const softwareList = [
  {
    id: 'sublime-text',
    name: 'Sublime Text',
    developer: 'Sublime HQ',
    description: 'A sophisticated text editor for code, markup and prose',
    icon: 'https://www.sublimetext.com/images/icon.png',
    rating: 4.8,
    category: 'Development',
    command: 'subl'
  },
  {
    id: 'visual-studio-code',
    name: 'Visual Studio Code',
    developer: 'Microsoft',
    description: 'Free and powerful source code editor',
    icon: 'https://code.visualstudio.com/assets/images/code-stable.png',
    rating: 4.9,
    category: 'Development',
    command: 'code'
  },
  {
    id: 'node',
    name: 'Node.js',
    developer: 'OpenJS Foundation',
    description: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine',
    icon: 'https://nodejs.org/static/images/logo.svg',
    rating: 4.8,
    category: 'Development',
    command: 'node'
  },
  {
    id: 'postman',
    name: 'Postman',
    developer: 'Postman Inc.',
    description: 'API platform for building and using APIs',
    icon: 'https://cdn.worldvectorlogo.com/logos/postman.svg',
    rating: 4.7,
    category: 'Development',
    command: 'postman'
  },
  {
    id: 'docker',
    name: 'Docker',
    developer: 'Docker Inc.',
    description: 'Platform for developing, shipping, and running applications',
    icon: 'https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png',
    rating: 4.8,
    category: 'Development',
    command: 'docker'
  },
  {
    id: 'google-chrome',
    name: 'Google Chrome',
    developer: 'Google',
    description: 'Fast and secure web browser',
    icon: 'https://www.google.com/chrome/static/images/chrome-logo.svg',
    rating: 4.5,
    category: 'Internet',
    command: 'google-chrome'
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [installedSoftware, setInstalledSoftware] = useState([]);
  const [user, setUser] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [installingStates, setInstallingStates] = useState({});
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Function to load installed software
  const loadInstalledSoftware = useCallback(async () => {
    try {
      const response = await installationService.getInstalledSoftware();
      const data = Array.isArray(response) ? response : [];
      console.log('Loaded installed software:', data);
      setInstalledSoftware(data);
    } catch (error) {
      console.error('Error fetching installed software:', error);
      setInstalledSoftware([]);
    }
  }, []);

  // Function to scan and load software
  const scanAndLoadSoftware = useCallback(async () => {
    if (isScanning) return;
    
    try {
      setIsScanning(true);
      console.log('Starting software scan...');
      
      // First scan for installed software
      const scanResult = await installationService.scanInstalledSoftware();
      console.log('Scan completed:', scanResult);
      
      // Then get the updated list
      await loadInstalledSoftware();
    } catch (error) {
      console.error('Error during software scan:', error);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, loadInstalledSoftware]);

  // Initial load and scan
  useEffect(() => {
    const initializeSoftware = async () => {
      if (!authService.isAuthenticated()) return;

      try {
        // First load existing data
        await loadInstalledSoftware();
        
        // Then do a scan if needed
        if (!isScanning) {
          setIsScanning(true);
          await installationService.scanInstalledSoftware();
          await loadInstalledSoftware(); // Refresh after scan
          setIsScanning(false);
        }
      } catch (error) {
        console.error('Error initializing software:', error);
        setIsScanning(false);
      }
    };

    initializeSoftware();
  }, [authService.isAuthenticated()]);

  // Periodic refresh of installed software without scanning
  useEffect(() => {
    if (!authService.isAuthenticated()) return;

    const interval = setInterval(() => {
      if (!isScanning) {
        loadInstalledSoftware();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loadInstalledSoftware, isScanning]);

  // Filter software based on category and search term
  const filteredSoftware = softwareList
    .map(software => {
      const installedApp = installedSoftware.find(installed => installed.appId === software.id);
      console.log(`Software ${software.id}:`, installedApp ? 'installed' : 'not installed');
      return {
        ...software,
        isInstalled: Boolean(installedApp),
        version: installedApp?.version || '1.0.0',
        appId: software.id // Ensure appId is set for API calls
      };
    })
    .filter(software => {
      const matchesCategory = selectedCategory === 'all' || 
        software.category.toLowerCase() === categories.find(c => c.id === selectedCategory)?.name.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        software.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        software.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        software.developer.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });

  // Enable auto-logout after inactivity
  const handleLogout = useCallback(() => {
    authService.logout();
    navigate('/login', { replace: true });
  }, [navigate]);

  const { showWarning, remainingTime, onStayLoggedIn } = useAutoLogout(handleLogout);

  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleInstall = useCallback(async (software) => {
    try {
      // Check if software is already installed
      const isAlreadyInstalled = installedSoftware.some(
        installed => installed.appId === software.id
      );

      if (isAlreadyInstalled) {
        setSnackbarState({
          open: true,
          message: `${software.name} is already installed`,
          severity: 'info'
        });
        return;
      }

      // Set installing state
      setInstallingStates(prev => ({ ...prev, [software.id]: true }));

      // First check if the package exists in Homebrew
      const commandCheck = await installationService.checkCommand(software.command);
      if (!commandCheck.exists) {
        setSnackbarState({
          open: true,
          message: `${software.name} is not found in Homebrew`,
          severity: 'error'
        });
        setInstallingStates(prev => ({ ...prev, [software.id]: false }));
        return;
      }

      // Proceed with installation
      await installationService.installSoftware({
        id: software.id,
        name: software.name,
        version: commandCheck.version || '1.0.0'
      });

      // Show success message
      setSnackbarState({
        open: true,
        message: `${software.name} has been successfully installed`,
        severity: 'success'
      });

      // Refresh installed software list
      await loadInstalledSoftware();
    } catch (error) {
      console.error('Error installing software:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setSnackbarState({
        open: true,
        message: `Failed to install ${software.name}: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setInstallingStates(prev => ({ ...prev, [software.id]: false }));
    }
  }, [loadInstalledSoftware, installedSoftware]);

  const [checkingStates, setCheckingStates] = useState({});

  const handleCheck = useCallback(async (software) => {
    if (checkingStates[software.id]) return;

    try {
      setCheckingStates(prev => ({ ...prev, [software.id]: true }));
      const updateInfo = await installationService.checkForUpdates(software);

      if (!updateInfo.isUpdated) {
        setSnackbarState({
          open: true,
          message: `Unable to verify ${software.name} version`,
          severity: 'warning'
        });
        return;
      }

      if (updateInfo.hasUpdate) {
        setSnackbarState({
          open: true,
          message: `Update available for ${software.name}: v${updateInfo.latestVersion}`,
          severity: 'info'
        });
      } else {
        setSnackbarState({
          open: true,
          message: `${software.name} is up to date (v${updateInfo.currentVersion})`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setSnackbarState({
        open: true,
        message: `Failed to check for updates: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setCheckingStates(prev => ({ ...prev, [software.id]: false }));
    }
  }, [checkingStates]);

  const handleSnackbarClose = useCallback(() => {
    setSnackbarState(prev => ({ ...prev, open: false }));
  }, []);

  // Check authentication and user role
  useEffect(() => {
    const checkAuth = () => {
      if (!authService.isAuthenticated()) {
        console.log('Not authenticated, redirecting to login');
        navigate('/login');
        return;
      }

      const currentUser = authService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'user') {
        console.log('Invalid user role:', currentUser?.role);
        authService.logout();
        navigate('/login');
        return;
      }

      setUser(currentUser);
    };

    checkAuth();
    // Check auth status periodically
    const interval = setInterval(checkAuth, 60000); // every minute
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <Box>
      <Header 
        user={user}
        onLogout={handleLogout}
        onSearch={setSearchTerm}
      />
      <LogoutWarning 
        open={showWarning}
        onStayLoggedIn={onStayLoggedIn}
        onLogout={handleLogout}
        remainingTime={remainingTime}
      />
      <Box sx={{ 
        mt: '64px', // Height of header
        minHeight: 'calc(100vh - 64px)', // Full height minus header
        p: { xs: 2, sm: 3 },
        width: '100%'
      }}>
          <Box sx={{ 
            backgroundColor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            position: 'sticky',
            top: 64,
            zIndex: 1,
            mb: 3
          }}>
            <List sx={{ 
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 1, sm: 3 },
              px: { xs: 2, sm: 3 },
              py: 1
            }}>
              {categories.map((category) => (
                <ListItem
                  button
                  key={category.id}
                  selected={selectedCategory === category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  sx={{
                    borderRadius: 1,
                    width: 'auto',
                    minWidth: { xs: 'auto', sm: 120 },
                    px: { xs: 2, sm: 3 },
                    py: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: { xs: 30, sm: 40 },
                    '& .MuiSvgIcon-root': {
                      fontSize: { xs: '1.2rem', sm: '1.5rem' }
                    }
                  }}>
                    {category.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={category.name}
                    sx={{
                      '& .MuiTypography-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">
              {categories.find(c => c.id === selectedCategory)?.name}
              {searchTerm && ` - Search: "${searchTerm}"`}
            </Typography>
            {filteredSoftware.length === 0 && (
              <Typography variant="body1" color="text.secondary">
                No software found
              </Typography>
            )}
          </Box>
          <Grid 
            container 
            spacing={{ xs: 2, sm: 2.5 }} 
            justifyContent="flex-start"
            sx={{ px: { xs: 2, sm: 3 } }}
          >
            {filteredSoftware.map((software) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={software.id}>
                <AppCard 
                  {...software} 
                  onInstall={() => handleInstall(software)}
                  onCheck={() => handleCheck(software)}
                  isScanning={isScanning}
                  isInstalling={installingStates[software.id]}
                  isChecking={checkingStates[software.id]}
                />
              </Grid>
            ))}
          </Grid>
      </Box>
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarState.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HomePage;
