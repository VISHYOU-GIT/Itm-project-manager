import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit,
  Person,
  Email,
  School,
  Work,
  Phone,
  LocationOn,
  Save,
  Assignment,
  Group,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherAPI } from '../../utils/api';

const TeacherProfile = () => {
  const [editDialog, setEditDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    qualification: '',
    experience: '',
    specialization: '',
    bio: '',
  });
  const queryClient = useQueryClient();

  // Get teacher profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: teacherAPI.getProfile,
    select: (response) => response.data,
  });
  
  // Update form when profile data changes
  useEffect(() => {
    if (profile?.teacher) {
      setProfileForm({
        name: profile.teacher.name || '',
        email: profile.teacher.email || '',
        phone: profile.teacher.phone || '',
        department: profile.teacher.department || '',
        qualification: profile.teacher.qualification || '',
        experience: profile.teacher.experience || '',
        specialization: profile.teacher.specialization || '',
        bio: profile.teacher.bio || '',
      });
    }
  }, [profile]);

  // Get teacher statistics
  const { data: stats } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: teacherAPI.getStats,
    select: (response) => response.data,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => teacherAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] });
      setEditDialog(false);
    },
  });

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({
      ...profileForm,
    });
  };

  const openEditDialog = () => {
    setEditDialog(true);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const teacher = profile?.teacher;
  const teacherStats = stats || {};

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}
                  >
                    {teacher?.name?.charAt(0).toUpperCase() || 'T'}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {teacher?.name || 'Teacher'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {teacher?.department || 'Department not specified'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {teacher?.qualification || 'Qualification not specified'}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={openEditDialog}
                >
                  Edit Profile
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Email color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={teacher?.email || 'Not provided'}
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Phone color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone"
                    secondary={teacher?.phone || 'Not provided'}
                  />
                </ListItem>

                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Work color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Experience"
                    secondary={teacher?.experience || 'Not specified'}
                  />
                </ListItem>

                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Star color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Specialization"
                    secondary={teacher?.specialization || 'Not specified'}
                  />
                </ListItem>

                {teacher?.bio && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Person color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Bio"
                      secondary={teacher.bio}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            {/* Total Projects */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Assignment sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">Total Projects</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {teacherStats.totalProjects || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Students */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Group sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="body2">Active Students</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {teacherStats.activeStudents || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Completed Projects */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="body2">Completed Projects</Typography>
                  </Box>
                  <Typography variant="h4" color="info.main">
                    {teacherStats.completedProjects || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Success Rate */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Star sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="body2">Success Rate</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {teacherStats.totalProjects > 0 
                      ? Math.round((teacherStats.completedProjects / teacherStats.totalProjects) * 100)
                      : 0
                    }%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Recent Projects */}
        {teacherStats.recentProjects && teacherStats.recentProjects.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Projects
                </Typography>
                <List>
                  {teacherStats.recentProjects.map((project, index) => (
                    <React.Fragment key={project._id?.$oid || project._id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Assignment color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={project.name}
                          secondary={
                            <Box>
                              <Box component="span" sx={{ display: 'block', color: 'text.secondary' }}>
                                {project.description}
                              </Box>
                              {project.students && project.students.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  {project.students.map((student) => (
                                    <Chip
                                      key={student._id?.$oid || student._id}
                                      label={student.username}
                                      size="small"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <Chip
                          label={project.status || 'active'}
                          size="small"
                          color={project.status === 'completed' ? 'success' : 'primary'}
                        />
                      </ListItem>
                      {index < teacherStats.recentProjects.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Qualification"
                value={profileForm.qualification}
                onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Experience"
                value={profileForm.experience}
                onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                placeholder="e.g., 5 years"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Specialization"
                value={profileForm.specialization}
                onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                placeholder="e.g., Machine Learning, Web Development"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Bio"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="Brief description about yourself and your expertise..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateProfile}
            disabled={updateProfileMutation.isLoading}
            startIcon={<Save />}
          >
            {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alert */}
      {updateProfileMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to update profile. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default TeacherProfile;
