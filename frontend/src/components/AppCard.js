import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Button, Chip, CircularProgress } from '@mui/material';
import { 
  Download as DownloadIcon, 
  Refresh as RefreshIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import '../styles/AppCard.css';

const AppCard = ({ 
  name, 
  developer, 
  description, 
  icon, 
  rating, 
  isInstalled, 
  version,
  onCardClick,
  onInstall,
  onCheck,
  isScanning,
  isInstalling,
  isChecking
}) => {
  return (
    <Card className="app-card" onClick={onCardClick}>
      <CardMedia
        component="img"
        image={icon}
        alt={name}
        className="app-card-media"
      />
      <CardContent className="app-card-content">
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {isInstalled && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckIcon color="primary" sx={{ fontSize: 16 }} />
                <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                  v{version}
                </Typography>
              </Box>
            )}
            {isScanning && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress size={16} color="warning" />
                <Typography variant="body2" color="warning.main">
                  Scanning...
                </Typography>
              </Box>
            )}
            {isInstalling && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress size={16} color="info" />
                <Typography variant="body2" color="info.main">
                  Installing...
                </Typography>
              </Box>
            )}
          </Box>
          <Typography className="app-card-title" variant="h6" component="div">
            {name}
          </Typography>
        </Box>
        <Typography className="app-card-developer" variant="body2">
          {developer}
        </Typography>
        <Typography className="app-card-description" variant="body2">
          {description}
        </Typography>
        <Box className="app-card-actions" sx={{ mt: 'auto', pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {isInstalled ? (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CheckIcon />}
                className="app-card-button"
                disabled
                fullWidth
              >
                Already Installed
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={isChecking ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                className="app-card-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCheck?.();
                }}
                disabled={isScanning || isChecking}
                fullWidth
              >
                {isChecking ? 'Checking...' : 'Check for Updates'}
              </Button>
            </>
          ) : (
            <Button
              size="small"
              variant="contained"
              startIcon={isInstalling ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
              className="app-card-button"
              onClick={(e) => {
                e.stopPropagation();
                onInstall?.();
              }}
              disabled={isScanning || isInstalling}
              fullWidth
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AppCard;
