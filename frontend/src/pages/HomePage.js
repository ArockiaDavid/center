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
  Alert,
  Button
} from '@mui/material';
import Header from '../components/Header';
import { 
  Code as CodeIcon,
  Terminal as TerminalIcon,
  Build as BuildIcon,
  Refresh as RefreshIcon,
  Apps as AppsIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import AppCard from '../components/AppCard';
import LogoutWarning from '../components/LogoutWarning';
import '../styles/HomePage.css';

const categories = [
  { id: 'all', name: 'All Software', icon: <BuildIcon /> },
  { id: 'ide', name: 'IDEs & Editors', icon: <CodeIcon /> },
  { id: 'language', name: 'Programming Languages', icon: <TerminalIcon /> },
  { id: 'tool', name: 'Development Tools', icon: <AppsIcon /> },
  { id: 'database', name: 'Database Tools', icon: <StorageIcon /> }
];

// Software type mapping
const getSoftwareType = (software) => {
  const ides = ['visual-studio-code', 'pycharm-ce', 'intellij-idea-ce', 'eclipse-ide', 'webstorm', 'sublime-text', 'visual-studio'];
  const languages = ['python', 'java', 'node', 'r'];
  const databases = ['dbeaver-community', 'studio-3t'];
  
  if (ides.includes(software.id)) return 'ide';
  if (languages.includes(software.id)) return 'language';
  if (databases.includes(software.id)) return 'database';
  return 'tool';
};

const HomePage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [software, setSoftware] = useState([]);
  const [user, setUser] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [installingStates, setInstallingStates] = useState({});
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Function to load software
  const loadSoftware = useCallback(async () => {
    try {
      const response = await installationService.getInstalledSoftware();
      const data = Array.isArray(response) ? response : [];
      console.log('Loaded software:', data);
      // Ensure each software item has the required properties
      const processedData = data.map(s => ({
        ...s,
        id: s.id || s.appId, // Use appId as fallback
        appId: s.id || s.appId, // Ensure appId is set
        isInstalled: Boolean(s.isInstalled),
        version: s.version || '1.0.0',
        isCask: s.isCask !== false
      }));
      setSoftware(processedData);
    } catch (error) {
      console.error('Error fetching software:', error);
      setSoftware([]);
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
      
      if (scanResult) {
        // Then get the updated list
        await loadSoftware();
        setSnackbarState({
          open: true,
          message: 'Software scan completed successfully',
          severity: 'success'
        });
      } else {
        setSnackbarState({
          open: true,
          message: 'Software scan failed',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error during software scan:', error);
      setSnackbarState({
        open: true,
        message: 'Error scanning software',
        severity: 'error'
      });
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, loadSoftware]);

  // Initial load of software
  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadSoftware();
    }
  }, [loadSoftware]);

  // Manual scan button handler
  const handleScan = useCallback(async () => {
    if (!isScanning) {
      await scanAndLoadSoftware();
    }
  }, [isScanning, scanAndLoadSoftware]);

  // Filter software based on category and search term
  const filteredSoftware = software
    .filter(s => {
      const type = getSoftwareType(s);
      const matchesCategory = selectedCategory === 'all' || type === selectedCategory;
      
      const matchesSearch = !searchTerm || 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase());
      
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

  const handleInstall = useCallback(async () => {
    // Refresh software list after installation
    await loadSoftware();
  }, [loadSoftware]);

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {filteredSoftware.length === 0 && (
                <Typography variant="body1" color="text.secondary">
                  No software found
                </Typography>
              )}
              <Button 
                variant="contained" 
                onClick={handleScan}
                disabled={isScanning}
                startIcon={<RefreshIcon />}
                sx={{ minWidth: 140 }}
              >
                {isScanning ? 'Scanning...' : 'Scan Software'}
              </Button>
            </Box>
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
