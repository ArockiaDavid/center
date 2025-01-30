import React, { useCallback } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ChevronRight,
  Assessment as AssessmentIcon,
  Apps as AppsIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

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
    <nav className={`sidebar ${expanded ? '' : 'collapsed'}`}>
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
    </nav>
  );
};

export default Sidebar;
