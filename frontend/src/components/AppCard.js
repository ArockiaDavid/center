import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Button, Chip } from '@mui/material';
import { Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
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
  onCheck
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
        <div className="app-card-header">
          <Typography className="app-card-title" variant="h6" component="div">
            {name}
          </Typography>
          {isInstalled && (
            <Chip
              size="small"
              label={`v${version}`}
              className="app-card-version"
              color="primary"
            />
          )}
        </div>
        <Typography className="app-card-developer" variant="body2">
          {developer}
        </Typography>
        <Typography className="app-card-description" variant="body2">
          {description}
        </Typography>
        <div className="app-card-actions">
          {isInstalled ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              className="app-card-button"
              onClick={(e) => {
                e.stopPropagation();
                onCheck?.();
              }}
            >
              Check
            </Button>
          ) : (
            <Button
              size="small"
              variant="contained"
              startIcon={<DownloadIcon />}
              className="app-card-button"
              onClick={(e) => {
                e.stopPropagation();
                onInstall?.();
              }}
            >
              Install
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AppCard;
