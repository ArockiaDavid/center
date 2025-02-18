import React, { useCallback, useEffect, useRef } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ChevronRight,
  Assessment as AssessmentIcon,
  Apps as AppsIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

const MenuItem = React.memo(({ item, expanded }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === item.path;

  const handleClick = useCallback(() => {
    navigate(item.path);
  }, [navigate, item.path]);

  const menuItem = (
    <div 
      className={`menu-item ${active ? 'active' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className={`menu-icon ${active ? 'active' : ''}`}>
        {item.icon}
      </div>
      <span className={`menu-text ${active ? 'active' : ''}`}>
        {item.text}
      </span>
    </div>
  );

  return expanded ? menuItem : (
    <Tooltip title={item.text} placement="right">
      {menuItem}
    </Tooltip>
  );
});

const Sidebar = ({ open, expanded, onExpand, onClose }) => {
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  const handleToggle = useCallback(() => {
    onExpand(!expanded);
  }, [expanded, onExpand]);

  const adminMenuItems = [
    {
      text: 'Dashboard',
      icon: <AssessmentIcon />,
      path: '/admin-dashboard'
    },
    {
      text: 'User Management',
      icon: <PeopleIcon />,
      path: '/all-user'
    },
    {
      text: 'Application Management',
      icon: <AppsIcon />,
      path: '/application-management'
    }
  ];

  return (
    <Box
      component="nav"
      ref={sidebarRef} 
      className={`sidebar ${expanded ? '' : 'collapsed'}`}
      sx={{
        transform: {
          xs: open ? 'translateX(0)' : 'translateX(-100%)',
          md: 'none'
        },
        transition: 'transform 0.2s ease-out, width 0.2s ease-out',
        visibility: {
          xs: open ? 'visible' : 'hidden',
          md: 'visible'
        },
        boxShadow: {
          xs: open ? '4px 0 8px rgba(0, 0, 0, 0.1)' : 'none',
          md: '2px 0 4px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <div className="drawer-header">
        <IconButton
          className="toggle-button"
          onClick={handleToggle}
          size="small"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronRight />
        </IconButton>
      </div>
      <div className="menu-list">
        {adminMenuItems.map((item) => (
          <MenuItem 
            key={item.text}
            item={item}
            expanded={expanded}
          />
        ))}
      </div>
    </Box>
  );
};

export default Sidebar;
