import React from 'react';
import { styled } from '@mui/material/styles';
import { Card, CardContent, CardMedia, Typography, Box, Button, Chip } from '@mui/material';
import { Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  maxWidth: 280,
  transition: 'box-shadow 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[6]
  }
}));

const StyledCardMedia = styled(CardMedia)({
  height: 100,
  objectFit: 'contain',
  padding: 16,
  backgroundColor: '#f5f5f5'
});

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: 16,
  '&:last-child': {
    paddingBottom: 16
  },
  backgroundColor: theme.palette.background.default
}));

const StyledTitle = styled(Typography)({
  fontSize: '0.95rem',
  marginBottom: 4,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
});

const StyledDeveloper = styled(Typography)({
  fontSize: '0.8rem',
  marginBottom: 4,
  color: 'text.secondary',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
});

const StyledDescription = styled(Typography)({
  fontSize: '0.8rem',
  marginBottom: 12,
  color: 'text.secondary',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
});

const VersionChip = styled(Chip)(({ theme }) => ({
  height: 20,
  fontSize: '0.75rem',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '& .MuiChip-label': {
    padding: '0 8px'
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginLeft: 'auto',
  minWidth: 75,
  height: 28,
  '& .MuiButton-startIcon': {
    marginRight: 4
  }
}));

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
    <StyledCard onClick={onCardClick}>
      <StyledCardMedia
        component="img"
        image={icon}
        alt={name}
      />
      <StyledCardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <StyledTitle variant="h6" component="div">
            {name}
          </StyledTitle>
          {isInstalled && (
            <VersionChip
              size="small"
              label={`v${version}`}
            />
          )}
        </Box>
        <StyledDeveloper variant="body2">
          {developer}
        </StyledDeveloper>
        <StyledDescription variant="body2">
          {description}
        </StyledDescription>
        <Box sx={{ mt: 'auto', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {isInstalled ? (
            <StyledButton
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onCheck?.();
              }}
            >
              Check
            </StyledButton>
          ) : (
            <StyledButton
              size="small"
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onInstall?.();
              }}
            >
              Install
            </StyledButton>
          )}
        </Box>
      </StyledCardContent>
    </StyledCard>
  );
};

export default AppCard;
