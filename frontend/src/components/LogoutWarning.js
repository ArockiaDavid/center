import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  LinearProgress,
  Typography
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const LogoutWarning = ({ open, onStayLoggedIn, onLogout, remainingTime }) => {
  // Calculate progress value (0-100)
  const progress = (remainingTime / 60) * 100; // 60 seconds warning time

  return (
    <Dialog
      open={open}
      onClose={onStayLoggedIn}
      aria-labelledby="logout-warning-title"
      aria-describedby="logout-warning-description"
    >
      <DialogTitle 
        id="logout-warning-title"
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          color: 'warning.main'
        }}
      >
        <WarningIcon color="warning" />
        Session Timeout Warning
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="logout-warning-description">
          Your session is about to expire due to inactivity. You will be automatically logged out in:
        </DialogContentText>
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography 
            variant="h4" 
            align="center" 
            color="warning.main"
            sx={{ mb: 2 }}
          >
            {Math.floor(remainingTime)} seconds
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress}
            color="warning"
            sx={{ 
              height: 8,
              borderRadius: 4
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onLogout}
          color="error"
          variant="outlined"
        >
          Logout Now
        </Button>
        <Button
          onClick={onStayLoggedIn}
          variant="contained"
          autoFocus
        >
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogoutWarning;
