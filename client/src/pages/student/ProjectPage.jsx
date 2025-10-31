import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  School,
  Group,
  Assignment,
  TrendingUp,
  AccessTime,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { studentAPI } from '../../utils/api';

const StudentProject = () => {
  const [updateDialog, setUpdateDialog] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Get student profile and project
  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: studentAPI.getProfile,
    select: (response) => response.data,
  });

  // Get daily updates
  const { data: updates } = useQuery({
    queryKey: ['student-updates'],
    queryFn: studentAPI.getDailyUpdates,
    select: (response) => response.data.updates
  });

  // Project update mutation
  const updateProjectMutation = useMutation({
    mutationFn: studentAPI.updateProject,
    onSuccess: () => {
      toast.success('Project update submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['student-updates'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      setUpdateDialog(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to submit update');
    },
  });

  // Edit update mutation
  const editUpdateMutation = useMutation({
    mutationFn: ({ updateId, data }) => studentAPI.editUpdate(updateId, data),
    onSuccess: () => {
      toast.success('Update edited successfully!');
      queryClient.invalidateQueries({ queryKey: ['student-updates'] });
      setUpdateDialog(false);
      setEditingUpdate(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to edit update');
    },
  });

  const onSubmitUpdate = (data) => {
    if (editingUpdate) {
      editUpdateMutation.mutate({ updateId: editingUpdate._id, data });
    } else {
      updateProjectMutation.mutate(data);
    }
  };

  const handleEditUpdate = (update) => {
    setEditingUpdate(update);
    reset({
      name: update.name,
      description: update.description,
      report: update.report,
    });
    setUpdateDialog(true);
  };

  const handleCloseDialog = () => {
    setUpdateDialog(false);
    setEditingUpdate(null);
    reset();
  };

  if (isLoading) return <Box>Loading...</Box>;

  const project = profile?.student?.project;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Project
      </Typography>

      {!project ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No project assigned yet. Please request an incharge to get started.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Project Overview */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" color="primary" gutterBottom>
                  {project.name || 'Untitled Project'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      Incharge: {project.incharge?.username || 'Not assigned'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {project.incharge?.email}
                    </Typography>
                  </Box>
                </Box>

                {project.progress !== undefined && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {project.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={project.progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}

                {profile.student.partners && profile.student.partners.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Project Partners:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {profile.student.partners.map((partner) => (
                        <Chip
                          key={partner._id?.$oid || partner._id}
                          avatar={<Avatar><Group /></Avatar>}
                          label={`${partner.username} (${partner.rollNo})`}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assignment sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">
                    Total Updates: {updates?.length || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2">
                    Progress: {project?.progress || 0}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTime sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="body2">
                    Last Update: {updates?.[0] ? new Date(updates[0].timestamp).toLocaleDateString() : 'None'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Daily Updates Section */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    Daily Updates
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setUpdateDialog(true)}
                    disabled={!project}
                  >
                    Add Update
                  </Button>
                </Box>

                {updates && updates.length > 0 ? (
                  <List>
                    {updates.map((update, index) => (
                      <React.Fragment key={update._id?.$oid || update._id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography component="span" variant="subtitle1">
                                  {update.name || 'Daily Update'}
                                </Typography>
                                <Typography component="span" variant="caption" color="text.secondary">
                                  {new Date(update.timestamp).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Box component="span" sx={{ display: 'block', mb: 1 }}>
                                  {update.description}
                                </Box>
                                {update.report && (
                                  <Box component="span" sx={{ display: 'block', color: 'text.secondary' }}>
                                    Report: {update.report}
                                  </Box>
                                )}
                                {update.inchargeComment && (
                                  <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                    <Box component="span" sx={{ display: 'block', color: 'primary.main' }}>
                                      Incharge Comment: {update.inchargeComment}
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              onClick={() => handleEditUpdate(update)}
                              sx={{ mr: 1 }}
                            >
                              <Edit />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < updates.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Updates Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start by adding your first daily update
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Add/Edit Update Dialog */}
      <Dialog 
        open={updateDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {editingUpdate ? 'Edit Update' : 'Add Daily Update'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmitUpdate)}>
          <DialogContent>
            <TextField
              fullWidth
              label="Project Name"
              margin="normal"
              {...register('name', { required: 'Project name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              margin="normal"
              {...register('description', { required: 'Description is required' })}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
            <TextField
              fullWidth
              label="Detailed Report"
              multiline
              rows={4}
              margin="normal"
              {...register('report', { required: 'Report is required' })}
              error={!!errors.report}
              helperText={errors.report?.message}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={updateProjectMutation.isLoading || editUpdateMutation.isLoading}
            >
              {editingUpdate ? 'Update' : 'Submit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default StudentProject;
