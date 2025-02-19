import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Button, CircularProgress } from '@mui/material';
import { 
  Check as CheckIcon,
  Code as CodeIcon,
  Terminal as TerminalIcon,
  Apps as AppsIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import UpdateChecker from './UpdateChecker';
import SoftwareInstaller from './SoftwareInstaller';
import '../styles/AppCard.css';

const AppCard = ({ 
  id,
  name, 
  description, 
  category,
  isCask,
  isInstalled, 
  version,
  icon,
  onInstall,
  onCheck,
  isScanning,
  isInstalling,
  isChecking
}) => {
  const [installProgress, setInstallProgress] = useState(0);
  const getTypeInfo = (id) => {
    const ides = ['visual-studio-code', 'pycharm-ce', 'intellij-idea-ce', 'eclipse-ide', 'webstorm', 'sublime-text', 'visual-studio'];
    const languages = ['python', 'java', 'node', 'r'];
    const databases = ['dbeaver-community', 'studio-3t'];
    
    if (ides.includes(id)) return { type: 'IDE/Editor', categoryIcon: <CodeIcon /> };
    if (languages.includes(id)) return { type: 'Programming Language', categoryIcon: <TerminalIcon /> };
    if (databases.includes(id)) return { type: 'Database Tool', categoryIcon: <StorageIcon /> };
    return { type: 'Development Tool', categoryIcon: <AppsIcon /> };
  };

  const { type, categoryIcon } = getTypeInfo(id);
  
  return (
    <Card className="app-card">
      <CardContent className="app-card-content">
        {icon && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 2,
            '& img': {
              width: 64,
              height: 64,
              objectFit: 'contain'
            }
          }}>
            <img src={icon} alt={`${name} icon`} />
          </Box>
        )}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {isInstalled ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckIcon color="success" sx={{ fontSize: 16 }} />
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                  Installed v{version}
                </Typography>
              </Box>
            ) : isScanning ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress size={16} color="warning" />
                <Typography variant="body2" color="warning.main">
                  Scanning...
                </Typography>
              </Box>
            ) : isInstalling ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress 
                  size={16} 
                  color="info" 
                  variant={installProgress > 0 ? "determinate" : "indeterminate"} 
                  value={installProgress}
                />
                <Typography variant="body2" color="info.main">
                  {installProgress > 0 ? `Installing (${installProgress}%)` : 'Installing...'}
                </Typography>
              </Box>
            ) : null}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {categoryIcon}
            <Typography className="app-card-title" variant="h6" component="div">
              {name}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {type}
          </Typography>
        </Box>
        <Typography className="app-card-description" variant="body2">
          {description}
        </Typography>
        <Box className="app-card-actions" sx={{ mt: 'auto', pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {isScanning ? (
            <Button
              size="small"
              variant="contained"
              color="warning"
              startIcon={<CircularProgress size={16} color="inherit" />}
              className="app-card-button"
              disabled
              fullWidth
            >
              Scanning...
            </Button>
          ) : isInstalled ? (
            <UpdateChecker
              software={{ id, name, version, isCask }}
              onUpdateComplete={onInstall}
              className="app-card-button"
            />
          ) : (
            <SoftwareInstaller 
              software={{ id, name, isCask }}
              onInstallComplete={onInstall}
              onProgressUpdate={setInstallProgress}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AppCard;
