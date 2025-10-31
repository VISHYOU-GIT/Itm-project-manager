import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Update,
  AccessTime,
  Comment,
  TrendingUp,
  Assignment,
  CheckCircle,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../utils/api';

const StudentUpdates = () => {
  const navigate = useNavigate();

  // Get daily updates
  const { data: updates, isLoading } = useQuery({
    queryKey: ['student-updates'],
    queryFn: studentAPI.getDailyUpdates,
    select: (response) => response.data.updates,
  });

  // Get student profile
  const { data: profile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: studentAPI.getProfile,
    select: (response) => response.data,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const project = profile?.student?.project;
  const recentUpdates = updates?.slice(0, 10) || [];
  const updatesWithComments = updates?.filter(update => update.inchargeComment) || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Daily Updates
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/student/project')}
          startIcon={<Update />}
        >
          Add New Update
        </Button>
      </Box>

      {!project ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Project Assigned
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Request an incharge to start submitting daily updates
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Summary Stats */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Update Statistics
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Update sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">Total Updates</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {updates?.length || 0}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Comment sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="body2">With Comments</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {updatesWithComments.length}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTime sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="body2">This Week</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {updates?.filter(update => {
                      const updateDate = new Date(update.timestamp);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return updateDate >= weekAgo;
                    }).length || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Updates */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Updates
                </Typography>
                {recentUpdates.length > 0 ? (
                  <List>
                    {recentUpdates.map((update, index) => (
                      <React.Fragment key={update._id?.$oid || update._id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <Update />
                          </Avatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography component="span" variant="subtitle1">
                                  {update.name || 'Daily Update'}
                                </Typography>
                                <Typography component="span" variant="caption" color="text.secondary">
                                  {new Date(update.timestamp).toLocaleDateString()}
                                </Typography>
                                {update.inchargeComment && (
                                  <Chip 
                                    icon={<Comment />}
                                    label="Commented" 
                                    size="small" 
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Box component="span" sx={{ display: 'block', mb: 1 }}>
                                  {update.description}
                                </Box>
                                {update.report && (
                                  <Box component="span" sx={{ display: 'block', color: 'text.secondary', mb: 1 }}>
                                    <strong>Report:</strong> {update.report.length > 100 
                                      ? `${update.report.substring(0, 100)}...` 
                                      : update.report
                                    }
                                  </Box>
                                )}
                                {update.inchargeComment && (
                                  <Box sx={{ 
                                    mt: 1, 
                                    p: 1, 
                                    bgcolor: 'action.hover', 
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'success.light'
                                  }}>
                                    <Box component="span" sx={{ display: 'block', color: 'success.dark' }}>
                                      <strong>Incharge Comment:</strong> {update.inchargeComment}
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < recentUpdates.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Update sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Updates Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Start by submitting your first daily update
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => navigate('/student/project')}
                      startIcon={<Update />}
                    >
                      Add First Update
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Updates with Comments */}
          {updatesWithComments.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Updates with Incharge Comments
                  </Typography>
                  <List>
                    {updatesWithComments.map((update, index) => (
                      <React.Fragment key={update._id?.$oid || update._id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                            <Comment />
                          </Avatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle1">
                                  {update.name || 'Daily Update'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(update.timestamp).toLocaleDateString()}
                                </Typography>
                                <Chip 
                                  icon={<CheckCircle />}
                                  label="Reviewed" 
                                  size="small" 
                                  color="success"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  {update.description}
                                </Typography>
                                <Box sx={{ 
                                  mt: 1, 
                                  p: 2, 
                                  bgcolor: 'success.lighter', 
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'success.light'
                                }}>
                                  <Typography variant="body2" color="success.dark">
                                    <strong>Incharge Feedback:</strong>
                                  </Typography>
                                  <Typography variant="body2" color="success.dark" sx={{ mt: 0.5 }}>
                                    {update.inchargeComment}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < updatesWithComments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default StudentUpdates;
