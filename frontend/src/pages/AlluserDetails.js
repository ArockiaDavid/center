import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  Grid
} from '@mui/material';
import config from '../config';
import { styled } from '@mui/material/styles';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Engineering as EngineerIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 600
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    cursor: 'pointer'
  },
  '&:last-child td, &:last-child th': {
    border: 0
  }
}));

const getRoleIcon = (role) => {
  switch (role) {
    case 'admin':
      return <AdminIcon />;
    case 'engineer':
      return <EngineerIcon />;
    default:
      return <PersonIcon />;
  }
};

const getRoleColor = (role) => {
  switch (role) {
    case 'admin':
      return '#0088FE';
    case 'engineer':
      return '#00C49F';
    default:
      return '#FFBB28';
  }
};

const UserTable = ({ users, onDelete, onRowClick }) => {
  return (
    <TableContainer>
      <Table sx={{ minWidth: 700 }} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell>User</StyledTableCell>
            <StyledTableCell>Email</StyledTableCell>
            <StyledTableCell>Role</StyledTableCell>
            <StyledTableCell align="right">Actions</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <StyledTableRow 
              key={user._id}
              onClick={() => user.role !== 'admin' ? onRowClick(user._id) : null}
              sx={{
                ...user.role === 'admin' && {
                  cursor: 'default !important',
                  '&:hover': {
                    backgroundColor: 'inherit !important'
                  }
                }
              }}
            >
              <StyledTableCell component="th" scope="row">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={user.avatar ? (user.avatar.startsWith('data:') ? user.avatar : user.avatar.startsWith('http') ? user.avatar : `${config.apiUrl}${user.avatar}`) : undefined}
                    alt={user.name}
                    sx={{ 
                      width: 40, 
                      height: 40,
                      mr: 2,
                      border: `2px solid ${getRoleColor(user.role)}`,
                      bgcolor: `${getRoleColor(user.role)}40`
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body1">
                    {user.name}
                  </Typography>
                </Box>
              </StyledTableCell>
              <StyledTableCell>{user.email}</StyledTableCell>
              <StyledTableCell>
                <Chip
                  icon={getRoleIcon(user.role)}
                  label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  sx={{
                    backgroundColor: `${getRoleColor(user.role)}20`,
                    color: getRoleColor(user.role),
                    '& .MuiChip-icon': {
                      color: getRoleColor(user.role)
                    }
                  }}
                />
              </StyledTableCell>
              <StyledTableCell align="right">
                {user.role !== 'admin' && (
                  <>
                    <IconButton
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(user._id);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(user);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
              </StyledTableCell>
            </StyledTableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                <Typography color="text.secondary">
                  No users found in this category
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const AlluserDetails = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        navigate('/login');
        return;
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.apiUrl}/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRowClick = (userId) => {
    navigate(`/user-details/${userId}`);
  };

  const handleDeleteClick = (user) => {
    setDeleteDialog({ open: true, user });
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/users/${deleteDialog.user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter(u => u._id !== deleteDialog.user._id));
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete user',
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, user: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, user: null });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminUsers = filteredUsers.filter(user => user.role === 'admin');
  const regularUsers = filteredUsers.filter(user => user.role !== 'admin');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              boxShadow: 1,
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ flex: 1, fontWeight: 600, color: 'primary.main' }}>
                User Management
              </Typography>
              <TextField
                size="small"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 250 }}
              />
            </Box>

            {error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
                >
                  <Tab 
                    label={`Administrators (${adminUsers.length})`}
                    icon={<AdminIcon />}
                    iconPosition="start"
                  />
                  <Tab 
                    label={`Users (${regularUsers.length})`}
                    icon={<PersonIcon />}
                    iconPosition="start"
                  />
                </Tabs>

                <Box sx={{ mt: 2 }}>
                  {activeTab === 0 ? (
                    <UserTable
                      users={adminUsers}
                      onDelete={handleDeleteClick}
                      onRowClick={handleRowClick}
                    />
                  ) : (
                    <UserTable
                      users={regularUsers}
                      onDelete={handleDeleteClick}
                      onRowClick={handleRowClick}
                    />
                  )}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Delete User
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {deleteDialog.user?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AlluserDetails;
