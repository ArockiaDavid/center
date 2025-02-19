import React, { useState } from 'react';
import { Box, Button, LinearProgress, Typography, Alert, Paper } from '@mui/material';
import { Download as DownloadIcon, Check as CheckIcon } from '@mui/icons-material';
import { installationService } from '../api/installationService';
import config from '../config';

const SoftwareInstaller = ({ software, onInstallComplete, onProgressUpdate }) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState(null);
  const [installationStatus, setInstallationStatus] = useState('');
  const [installationDetails, setInstallationDetails] = useState('');
  const [progress, setProgress] = useState(0);

  const updateProgress = (newProgress, status, details) => {
    setProgress(newProgress);
    setInstallationStatus(status);
    setInstallationDetails(details);
    onProgressUpdate?.(newProgress);
  };

  const handleInstall = async () => {
    let eventSource = null;
    try {
      setIsInstalling(true);
      setError(null);
      updateProgress(10, 'Initializing...', 'Starting installation process');

      // Create SSE connection with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let connectionTimeout;
      
      const createEventSource = () => {
        if (eventSource) {
          eventSource.close();
        }

        console.log('Creating new EventSource connection...');
        return new Promise((resolve, reject) => {
          try {
            const token = localStorage.getItem('token');
            const sseUrl = `${config.apiUrl}/user-software/install-progress?token=${token}`;
            console.log('Creating SSE connection to:', sseUrl);
            eventSource = new EventSource(sseUrl);
            let connected = false;
            
            // Set connection timeout
            connectionTimeout = setTimeout(() => {
              if (!connected) {
                eventSource.close();
                if (retryCount < maxRetries) {
                  retryCount++;
                  updateProgress(10, 'Retrying connection...', `Attempt ${retryCount} of ${maxRetries}`);
                  resolve(createEventSource());
                } else {
                  reject(new Error('Unable to establish connection. Please check your network and try again.'));
                }
              }
            }, 15000);

            eventSource.onopen = (event) => {
              console.log('SSE connection opened:', event);
              connected = true;
              clearTimeout(connectionTimeout);
              console.log('SSE connection established');
              resolve();
            };

            eventSource.onmessage = (event) => {
              try {
                console.log('Received SSE message:', {
                  data: event.data,
                  lastEventId: event.lastEventId,
                  origin: event.origin
                });
                const data = JSON.parse(event.data);
                if (data.type === 'connected') {
                  console.log('SSE connection confirmed');
                } else if (data.type === 'progress') {
                  console.log('Progress update:', data);
                  updateProgress(data.progress, data.status, data.details);
                  if (data.progress === 100) {
                    console.log('Installation progress complete');
                  }
                } else if (data.type === 'complete') {
                  console.log('Installation complete');
                  updateProgress(100, 'Complete', 'Installation completed successfully');
                  onInstallComplete?.();
                  eventSource.close();
                  resolve();
                } else if (data.type === 'error') {
                  console.log('Installation error:', data.message);
                  eventSource.close();
                  reject(new Error(data.message));
                }
              } catch (error) {
                console.error('Error parsing SSE message:', error);
                eventSource.close();
                reject(new Error('Error processing installation update'));
              }
            };

            eventSource.onerror = (error) => {
              console.error('SSE Error:', {
                error,
                readyState: eventSource.readyState,
                url: eventSource.url
              });
              if (!connected) {
                if (retryCount < maxRetries) {
                  retryCount++;
                  updateProgress(10, 'Retrying connection...', `Attempt ${retryCount} of ${maxRetries}`);
                  resolve(createEventSource());
                } else {
                  reject(new Error('Unable to establish connection after multiple attempts'));
                }
              } else if (eventSource.readyState === EventSource.CLOSED) {
                reject(new Error('Connection closed unexpectedly'));
              } else {
                reject(new Error('Connection error during installation'));
              }
            };
          } catch (error) {
            clearTimeout(connectionTimeout);
            reject(new Error('Error creating connection'));
          }
        });
      };

      // First check if package exists in Homebrew
      const commandCheck = await installationService.checkCommand(software.id);
      if (!commandCheck.exists) {
        throw new Error(`${software.name} is not found in Homebrew`);
      }

      // Establish SSE connection
      await createEventSource();
      updateProgress(20, 'Connected', 'Starting installation process');

      // Start installation
      await installationService.installSoftware({
        id: software.id,
        name: software.name,
        version: commandCheck.version || '1.0.0',
        isCask: software.isCask !== false
      });

      // Wait for installation to complete or error
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          eventSource?.close();
          reject(new Error('Installation timed out'));
        }, 300000); // 5 minutes timeout

        const checkInterval = setInterval(() => {
          const token = localStorage.getItem('token');
          if (!token) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            eventSource?.close();
            reject(new Error('Session expired. Please log in again.'));
          }
          if (progress === 100) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve();
          }
        }, 1000);

        // Handle SSE errors
        eventSource.onerror = () => {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          reject(new Error('Connection lost. Please try again.'));
        };
      });

    } catch (error) {
      console.error('Error installing software:', error);
      const errorMsg = error.response?.data?.message || error.message;
      
      // Reset progress and installation status
      setProgress(0);
      setInstallationStatus('');
      setInstallationDetails('');
      
      // Handle specific error cases
      if (errorMsg.includes('already installed')) {
        setError('This software is already installed on your system.');
      } else if (errorMsg.includes('Homebrew is not installed')) {
        setError('Homebrew is required. Please install Homebrew first by running the following command in Terminal:');
        setInstallationDetails('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
      } else if (errorMsg.includes('Insufficient permissions') || errorMsg.includes('Sudo access required')) {
        setError('Permission error. Please ensure you have write access to the Applications folder.');
        setInstallationDetails('You may need to run: sudo chmod -R 755 /Applications');
      } else if (errorMsg.includes('Application not found')) {
        setError('Installation failed: Application was not found in Applications folder.');
        setInstallationDetails('Please check system permissions and try again.');
      } else if (errorMsg.includes('timed out')) {
        setError('Installation timed out. Please try again.');
      } else {
        setError(`Installation failed: ${errorMsg}`);
      }
    } finally {
      if (eventSource) {
        eventSource.close();
      }
      setIsInstalling(false);
    }
  };

  return (
    <Box>
      {error ? (
        <Paper elevation={3} sx={{ p: 2, bgcolor: '#FFF4F4', mb: 2 }}>
          <Alert 
            severity="error" 
            sx={{ 
              mb: 1,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {error}
          </Alert>
          {installationDetails && (
            <Typography 
              variant="body2" 
              color="error" 
              sx={{ 
                mt: 1,
                pl: 6, // Align with error message
                fontFamily: 'monospace',
                wordBreak: 'break-word'
              }}
            >
              {installationDetails}
            </Typography>
          )}
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => {
              setError(null);
              setInstallationDetails('');
            }}
            sx={{ mt: 2, ml: 6 }}
          >
            Try Again
          </Button>
        </Paper>
      ) : isInstalling ? (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" color="primary" fontWeight="medium">
                  {installationStatus}
                </Typography>
                <Typography variant="subtitle1" color="primary" fontWeight="medium">
                  {progress}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    backgroundColor: progress === 100 ? '#4caf50' : '#1976d2'
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                {installationDetails}
              </Typography>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Button
          variant="contained"
          startIcon={progress === 100 ? <CheckIcon /> : <DownloadIcon />}
          onClick={handleInstall}
          fullWidth
          color={progress === 100 ? "success" : "primary"}
          disabled={progress === 100}
        >
          {progress === 100 ? 'Installed' : 'Install'}
        </Button>
      )}
    </Box>
  );
};

export default SoftwareInstaller;
