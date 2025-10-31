import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  School,
  Person,
  Send,
  CheckCircle,
  Pending,
  Cancel,
  Email,
  Add,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { studentAPI } from '../../utils/api';

const StudentIncharge = () => {
  const [requestDialog, setRequestDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Get available teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['available-teachers'],
    queryFn: studentAPI.getTeachers,
    select: (response) => response.data.teachers,
  });

  // Get student profile to check current incharge
  const { data: profile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: studentAPI.getProfile,
    select: (response) => response.data,
  });

  // Request incharge mutation
  const requestInchargeMutation = useMutation({
    mutationFn: studentAPI.requestIncharge,
    onSuccess: () => {
      toast.success('Incharge request sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      setRequestDialog(false);
      setSelectedTeacher(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to send request');
    },
  });

  const handleRequestIncharge = (teacher) => {
    setSelectedTeacher(teacher);
    setRequestDialog(true);
  };

  const onSubmitRequest = (data) => {
    requestInchargeMutation.mutate({
      teacherId: selectedTeacher._id,
      message: data.message,
    });
  };

  const handleCloseDialog = () => {
    setRequestDialog(false);
    setSelectedTeacher(null);
    reset();
  };

  if (teachersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const currentProject = profile?.student?.project;
  const currentIncharge = currentProject?.incharge;
  const hasIncharge = !!currentIncharge;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Project Incharge
      </Typography>

      {hasIncharge ? (
        <Grid container spacing={3}>
          {/* Current Incharge */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  Current Incharge
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'success.main', width: 56, height: 56 }}>
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {currentIncharge.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Email sx={{ mr: 0.5, fontSize: 16 }} />
                      {currentIncharge.email}
                    </Typography>
                  </Box>
                </Box>
                <Chip 
                  icon={<CheckCircle />}
                  label="Assigned" 
                  color="success" 
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Project Details */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Details
                </Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  {currentProject.name || 'Project Title'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Assigned on: {new Date(currentProject.createdAt || new Date()).toLocaleDateString()}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progress: {currentProject.progress || 0}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Status: {currentProject.status || 'Active'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            You don't have an incharge assigned yet. Browse through available teachers and send a request to get started with your project.
          </Alert>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Teachers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select a teacher to request as your project incharge
              </Typography>

              {teachers && teachers.length > 0 ? (
                <List>
                  {teachers.map((teacher, index) => (
                    <React.Fragment key={teacher._id?.$oid || teacher._id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <School />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={teacher.username}
                          secondary={
                            <Box>
                              <Typography component="div" variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                <Email sx={{ mr: 0.5, fontSize: 14 }} />
                                {teacher.email}
                              </Typography>
                              <Typography component="div" variant="caption" color="text.secondary">
                                Projects: {teacher.assignedProjects?.length || 0}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Button
                            variant="outlined"
                            startIcon={<Send />}
                            onClick={() => handleRequestIncharge(teacher)}
                            size="small"
                          >
                            Request
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < teachers.length - 1 && <Divider key={`divider-${teacher._id?.$oid || teacher._id}`} />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Teachers Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please check back later or contact the administration
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Request Dialog */}
      <Dialog 
        open={requestDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Request Incharge
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmitRequest)}>
          <DialogContent>
            {selectedTeacher && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {selectedTeacher.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedTeacher.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            <TextField
              fullWidth
              label="Request Message"
              multiline
              rows={4}
              placeholder="Write a message explaining why you'd like this teacher as your incharge..."
              {...register('message', { required: 'Message is required' })}
              error={!!errors.message}
              helperText={errors.message?.message || 'This message will be sent to the teacher along with your request.'}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={requestInchargeMutation.isLoading}
              startIcon={requestInchargeMutation.isLoading ? <CircularProgress size={16} /> : <Send />}
            >
              Send Request
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default StudentIncharge;
