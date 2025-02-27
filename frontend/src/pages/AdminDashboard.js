import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  useTheme
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import {
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon
} from '@mui/icons-material';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];
const RADIAN = Math.PI / 180;

// Custom active shape for pie chart
const renderActiveShape = (props) => {
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      {/* Center text */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill={fill} style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={fill} style={{ fontSize: '1rem' }}>
        {`${value} Users`}
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#666" style={{ fontSize: '0.9rem' }}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>

      {/* Inner sector */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />

      {/* Outer sector */}
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />

      {/* Gradient overlay */}
      <defs>
        <radialGradient id={`gradient-${payload.name}`}>
          <stop offset="0%" stopColor={fill} stopOpacity={0.8} />
          <stop offset="100%" stopColor={fill} stopOpacity={0.3} />
        </radialGradient>
      </defs>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={`url(#gradient-${payload.name})`}
      />
    </g>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <Card sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #ccc',
        boxShadow: 3
      }}>
        <CardContent>
          <Typography variant="subtitle2" color="primary">
            {payload[0].name}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">
            Users: {payload[0].value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Percentage: {(payload[0].payload.percent * 100).toFixed(2)}%
          </Typography>
        </CardContent>
      </Card>
    );
  }
  return null;
};

// Stats card component
const StatsCard = ({ title, value, icon: Icon, color }) => (
  <Card 
    sx={{ 
      height: '100%',
      borderRadius: 3,
      background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 24px ${color}20`
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `linear-gradient(45deg, ${color}10, transparent)`,
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      }
    }}
  >
    <CardContent sx={{ position: 'relative' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        gap: 1.5
      }}>
        <Icon sx={{ 
          color,
          fontSize: '2rem',
          filter: `drop-shadow(0 2px 4px ${color}40)`
        }} />
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'text.primary',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}
        >
          {title}
        </Typography>
      </Box>
      <Typography 
        variant="h3" 
        component="div" 
        sx={{ 
          fontWeight: 700,
          color,
          textShadow: `0 2px 4px ${color}20`,
          letterSpacing: '-1px'
        }}
      >
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    users: 0
  });
  const [activeIndex, setActiveIndex] = useState(0);

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
        
        // Process data for pie chart and stats
        const usersByRole = data.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});

        const total = Object.values(usersByRole).reduce((sum, count) => sum + count, 0);
        const chartData = Object.entries(usersByRole).map(([role, count]) => ({
          name: role.charAt(0).toUpperCase() + role.slice(1),
          value: count,
          percent: count / total
        }));

        setUserData(chartData);
        setStats({
          total,
          admins: usersByRole.admin || 0,
          users: usersByRole.user || 0
        });
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Unable to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

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
        {/* Stats Cards */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <StatsCard
                title="Total Users"
                value={stats.total}
                icon={PeopleIcon}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatsCard
                title="Admins"
                value={stats.admins}
                icon={AdminIcon}
                color={COLORS[0]}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatsCard
                title="Users"
                value={stats.users}
                icon={UserIcon}
                color={COLORS[2]}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Pie Chart */}
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
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
              User Distribution by Role
            </Typography>
            {error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <Box sx={{ 
                width: '100%', 
                height: 400,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                  pointerEvents: 'none'
                }
              }}>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={userData}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={120}
                      paddingAngle={2}
                      startAngle={90}
                      endAngle={450}
                      fill="#8884d8"
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                    >
                      {userData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          stroke={theme.palette.background.paper}
                          strokeWidth={3}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={<CustomTooltip />} 
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Legend 
                      verticalAlign="middle" 
                      align="right"
                      layout="vertical"
                      iconSize={12}
                      iconType="circle"
                      wrapperStyle={{
                        paddingLeft: '32px',
                        paddingRight: '8px'
                      }}
                      formatter={(value, entry) => (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'flex-start'
                        }}>
                          <Typography sx={{ 
                            color: entry.color,
                            fontWeight: 600,
                            fontSize: '0.9rem'
                          }}>
                            {value}
                          </Typography>
                          <Typography sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.75rem'
                          }}>
                            {entry.payload.value} users
                          </Typography>
                        </Box>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
