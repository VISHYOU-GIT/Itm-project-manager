import React, { useState } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Paper,
  CircularProgress,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Assignment,
  Person,
  Group,
  MoreVert,
  Add,
  Edit,
  Visibility,
  TrendingUp,
  Schedule,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../utils/api';

// Helper function to extract ID from MongoDB document format
const getMongoId = (doc) => {
  if (!doc) return '';
  if (doc.$oid) return doc.$oid;
  if (doc._id && doc._id.$oid) return doc._id.$oid;
  return String(doc._id || doc.id || '');
};

const TeacherProjects = () => {
  const [projectDialog, setProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    duration: '',
    requirements: '',
  });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get teacher's assigned projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['teacher-projects'],
    queryFn: teacherAPI.getAssignedProjects,
    select: (response) => {
      console.log('Raw project data:', response.data.projects);
      return response.data.projects;
    },
  });

  // Create/Update project mutation
  const saveProjectMutation = useMutation({
    mutationFn: (data) => editingProject 
      ? teacherAPI.updateProject(editingProject._id, data)
      : teacherAPI.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-projects'] });
      setProjectDialog(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setProjectForm({
      name: '',
      description: '',
      duration: '',
      requirements: '',
    });
    setEditingProject(null);
  };

  const handleSaveProject = () => {
    if (projectForm.name.trim() && projectForm.description.trim()) {
      saveProjectMutation.mutate({
        name: projectForm.name.trim(),
        description: projectForm.description.trim(),
        duration: projectForm.duration.trim(),
        requirements: projectForm.requirements.trim(),
      });
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setProjectDialog(true);
  };

  const openEditDialog = (project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description,
      duration: project.duration || '',
      requirements: project.requirements || '',
    });
    setProjectDialog(true);
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event, project) => {
    if (project && project._id) {
      setMenuAnchor(event.currentTarget);
      setSelectedProject(project);
    } else {
      console.error('Attempted to open menu for invalid project', project);
    }
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedProject(null);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const activeProjects = projects?.filter(p => p.status !== 'completed') || [];
  const completedProjects = projects?.filter(p => p.status === 'completed') || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          My Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreateDialog}
        >
          Create Project
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assignment sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">Total Projects</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {projects?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="body2">Active</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {activeProjects.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2">Completed</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {completedProjects.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Person sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="body2">Total Students</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {projects?.reduce((sum, p) => sum + (p.students?.length || 0), 0) || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
 
      
        {activeProjects.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Projects ({activeProjects.length})
          </Typography>
          <List>
            {activeProjects.map((project, index) => (
              <React.Fragment key={getMongoId(project) || index}>
            <ListItem sx={{ px: 0 }}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                <Assignment />
              </Avatar>
              <ListItemText
                primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography component="span" variant="subtitle1">
                  {project.name}
                </Typography>
                <Chip
                  label={project.status || 'active'}
                  size="small"
                  color={getStatusColor(project.status)}
                />
                <Chip
                  label={`ID: ${getMongoId(project)}`}
                  size="small"
                  variant="outlined"
                  color="default"
                  sx={{ fontSize: '0.7rem' }}
                />
                {project.students?.length > 0 && (
                  <Chip
                icon={<Person />}
                label={`${project.students.length} student${project.students.length > 1 ? 's' : ''}`}
                size="small"
                variant="outlined"
                  />
                )}
              </Box>
                }
                secondary={
              <Box>
                <Box component="span" sx={{ display: 'block', mb: 1 }}>
                  {project.description}
                </Box>
                {project.students && project.students.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                <Box component="span" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                  Assigned to:
                </Box>
                {project.students.map((student, i) => {
                  const studentId = getMongoId(student);
                  const displayName = student.name || student.username || 
                    (studentId ? `Student ${studentId.substring(0, 5)}` : `Student ${i+1}`);
                  
                  return (
                    <Chip
                  key={studentId || `student-${i}`}
                  label={displayName}
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  );
                })}
                  </Box>
                )}
                {project.progress !== undefined && (
                  <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    Progress
                  </Box>
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    {project.progress}%
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={project.progress} 
                  color={getProgressColor(project.progress)}
                />
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                size="small"
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => navigate(`/teacher/project/${getMongoId(project)}`)}
                  >
                View Details
                  </Button>
                </Box>
              </Box>
                }
              />
              <IconButton
                onClick={(e) => handleMenuOpen(e, project)}
              >
                <MoreVert />
              </IconButton>
            </ListItem>
            {index < activeProjects.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
            </CardContent>
          </Card>
        )}

        {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Completed Projects ({completedProjects.length})
            </Typography>
            <List>
              {completedProjects.map((project, index) => (
                <React.Fragment key={getMongoId(project) || index}>
                  <ListItem sx={{ px: 0 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                      <CheckCircle />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography component="span" variant="subtitle1">
                            {project.name}
                          </Typography>
                          <Chip
                            label="Completed"
                            size="small"
                            color="success"
                          />
                          <Chip
                            label={`ID: ${getMongoId(project)}`}
                            size="small"
                            variant="outlined"
                            color="default"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box component="span" sx={{ display: 'block', color: 'text.secondary' }}>
                            {project.description}
                          </Box>
                          {project.students && (
                            <Box component="span" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                              Students: {project.students.map(s => s.name).join(', ')}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/teacher/project/${getMongoId(project)}`)}
                    >
                      View
                    </Button>
                  </ListItem>
                  {index < completedProjects.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* No Projects */}
      {(!projects || projects.length === 0) && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Projects Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first project to start managing student assignments
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Create First Project
          </Button>
        </Paper>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => openEditDialog(selectedProject)}>
          <Edit sx={{ mr: 1 }} />
          Edit Project
        </MenuItem>
        <MenuItem 
          onClick={() => selectedProject ? 
            navigate(`/teacher/project/${getMongoId(selectedProject)}`) : 
            console.error('No project selected')}
        >
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
      </Menu>

      {/* Create/Edit Project Dialog */}
      <Dialog
        open={projectDialog}
        onClose={() => setProjectDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration (e.g., 3 months)"
                value={projectForm.duration}
                onChange={(e) => setProjectForm({ ...projectForm, duration: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Requirements"
                value={projectForm.requirements}
                onChange={(e) => setProjectForm({ ...projectForm, requirements: e.target.value })}
                placeholder="List any specific requirements or technologies..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProject}
            disabled={!projectForm.name.trim() || !projectForm.description.trim() || saveProjectMutation.isLoading}
          >
            {saveProjectMutation.isLoading ? 'Saving...' : (editingProject ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alert */}
      {saveProjectMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to save project. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default TeacherProjects;
