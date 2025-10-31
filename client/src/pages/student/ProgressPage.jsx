import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  TrendingUp,
  Assignment,
  AccessTime,
  School,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { studentAPI } from '../../utils/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const StudentProgress = () => {
  // Get student progress data
  const { data: progress, isLoading } = useQuery({
    queryKey: ['student-progress'],
    queryFn: studentAPI.getProgress,
    select: (response) => response.data,
  });

  // Get student profile
  const { data: profile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: studentAPI.getProfile,
    select: (response) => response.data,
  });

  // Get daily updates for progress tracking
  const { data: updates } = useQuery({
    queryKey: ['student-updates'],
    queryFn: studentAPI.getDailyUpdates,
    select: (response) => response.data.updates,
    }
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const project = profile?.student?.project;
  const targets = project?.targets || [];
  const completedTargets = targets.filter(target => target.completed);
  const progressPercentage = project?.progress || 0;

  // Prepare chart data
  const progressData = [
    { name: 'Completed', value: progressPercentage },
    { name: 'Remaining', value: 100 - progressPercentage },
  ];

  // Timeline data from updates
  const timelineData = updates?.slice(0, 10).map((update, index) => ({
    date: new Date(update.timestamp).toLocaleDateString(),
    progress: Math.min(progressPercentage + (index * 5), 100),
  })).reverse() || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Progress Tracking
      </Typography>

      {!project ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Project Assigned
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Request an incharge to start tracking your progress
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Overall Progress */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Overall Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercentage}
                      sx={{ height: 12, borderRadius: 6 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ minWidth: 50 }}>
                    {progressPercentage}%
                  </Typography>
                </Box>
                <Typography variant="h4" color="primary" gutterBottom>
                  {progressPercentage}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Project Completion
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Progress Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Progress Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={progressData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {progressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Project Targets */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Targets ({completedTargets.length}/{targets.length})
                </Typography>
                {targets.length > 0 ? (
                  <List>
                    {targets.map((target, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemIcon>
                            {target.completed ? (
                              <CheckCircle color="success" />
                            ) : (
                              <RadioButtonUnchecked color="action" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={target.title}
                            secondary={
                              <Box>
                                <Box component="span" sx={{ display: 'block', color: 'text.secondary' }}>
                                  {target.description}
                                </Box>
                                {target.dueDate && (
                                  <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.75rem' }}>
                                    Due: {new Date(target.dueDate).toLocaleDateString()}
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                          <Chip
                            label={target.completed ? 'Completed' : 'Pending'}
                            color={target.completed ? 'success' : 'default'}
                            size="small"
                          />
                        </ListItem>
                        {index < targets.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No targets set yet
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="body2">Total Updates</Typography>
                  </Box>
                  <Typography variant="h5" color="success.main">
                    {updates?.length || 0}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircle sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">Completed Tasks</Typography>
                  </Box>
                  <Typography variant="h5" color="primary">
                    {completedTargets.length}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTime sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="body2">Days Active</Typography>
                  </Box>
                  <Typography variant="h5" color="warning.main">
                    {updates?.length ? Math.ceil((new Date() - new Date(updates[updates.length - 1]?.timestamp)) / (1000 * 60 * 60 * 24)) : 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Incharge Info */}
            {project.incharge && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Incharge
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <School />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        {project.incharge.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {project.incharge.email}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Progress Timeline */}
          {timelineData.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Progress Timeline
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="progress" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default StudentProgress;
