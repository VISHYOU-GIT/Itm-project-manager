import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Alert,
  IconButton,
  Slider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Assignment,
  Person,
  Update,
  Comment,
  Edit,
  Save,
  ArrowBack,
  Group,
  Schedule,
  CheckCircle,
  TrendingUp,
  Description,
  RadioButtonUnchecked,
  Add,
  DeleteOutline,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../utils/api';

const TeacherProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    duration: '',
    requirements: '',
  });
  const [commentDialog, setCommentDialog] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [comment, setComment] = useState('');
  const [progressDialog, setProgressDialog] = useState(false);
  const [progressForm, setProgressForm] = useState({
    progress: 0,
  });
  const [targetDialog, setTargetDialog] = useState(false);
  const [targetForm, setTargetForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedStudents: [],
  });
  const [editingTarget, setEditingTarget] = useState(null);
  const queryClient = useQueryClient();

  // Get project details
  const { data: project, isLoading } = useQuery({
    queryKey: ['teacher-project-details', projectId],
    queryFn: () => {
      if (!projectId || projectId === 'undefined') {
        throw new Error('Invalid project ID');
      }
      return teacherAPI.getProjectDetails(projectId);
    },
    select: (response) => response.data.project,
    enabled: !!projectId && projectId !== 'undefined',
  });

  // Update form when project data changes
  useEffect(() => {
    if (project) {
      setProjectForm({
        name: project.name || '',
        description: project.description || '',
        duration: project.duration || '',
        requirements: project.requirements || '',
      });
    }
  }, [project]);

  // Get project updates
  const { data: updates } = useQuery({
    queryKey: ['teacher-project-updates', projectId],
    queryFn: () => {
      if (!projectId || projectId === 'undefined') {
        throw new Error('Invalid project ID');
      }
      return teacherAPI.getProjectUpdates(projectId);
    },
    select: (response) => response.data.updates,
    enabled: !!projectId && projectId !== 'undefined',
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: (data) => teacherAPI.updateProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-project-details', projectId] });
      setEditDialog(false);
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (data) => teacherAPI.addUpdateComment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-project-updates', projectId] });
      setCommentDialog(false);
      setSelectedUpdate(null);
      setComment('');
    },
  });
  
  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: (data) => teacherAPI.updateProjectProgress(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-project-details', projectId] });
      setProgressDialog(false);
    },
  });
  
  // Update targets mutation (handles add, edit, toggle)
  const updateTargetsMutation = useMutation({
    mutationFn: (data) => teacherAPI.updateProjectTargets(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-project-details', projectId] });
      setTargetDialog(false);
      resetTargetForm();
    },
  });

  const handleUpdateProject = () => {
    updateProjectMutation.mutate({
      name: projectForm.name.trim(),
      description: projectForm.description.trim(),
      duration: projectForm.duration.trim(),
      requirements: projectForm.requirements.trim(),
    });
  };

  const openEditDialog = () => {
    setEditDialog(true);
  };

  const openCommentDialog = (update) => {
    setSelectedUpdate(update);
    setComment(update.inchargeComment || '');
    setCommentDialog(true);
  };

  const handleAddComment = () => {
    if (selectedUpdate && comment.trim()) {
      addCommentMutation.mutate({
        updateId: selectedUpdate._id?.$oid || selectedUpdate._id,
        comment: comment.trim(),
      });
    }
  };

  const openProgressDialog = () => {
    setProgressForm({ progress: project.progress || 0 });
    setProgressDialog(true);
  };

  const handleUpdateProgress = () => {
    updateProgressMutation.mutate({
      progress: progressForm.progress
    });
  };

  const resetTargetForm = () => {
    setTargetForm({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      assignedStudents: [],
    });
    setEditingTarget(null);
  };

  const openTargetDialog = (target = null) => {
    if (target) {
      setEditingTarget(target);
      const dueDate = target.dueDate && target.dueDate.$date ? 
        new Date(target.dueDate.$date).toISOString().split('T')[0] : '';
      
      setTargetForm({
        title: target.title || '',
        description: target.description || '',
        priority: target.priority || 'medium',
        dueDate: dueDate,
        assignedStudents: target.assignedStudents?.map(id => typeof id === 'object' ? (id.$oid || '') : id) || []
      });
    } else {
      resetTargetForm();
    }
    setTargetDialog(true);
  };

  const handleSaveTarget = () => {
    if (targetForm.title.trim()) {
      if (!project || !project.targets) return;
      
      // Create a copy of the current targets
      let updatedTargets = [...project.targets];
      
      const targetData = {
        title: targetForm.title.trim(),
        description: targetForm.description.trim(),
        priority: targetForm.priority,
        dueDate: targetForm.dueDate ? new Date(targetForm.dueDate).toISOString() : null,
        assignedStudents: targetForm.assignedStudents,
        completed: false
      };
      
      if (editingTarget) {
        // Update existing target - find and replace it
        const targetIndex = updatedTargets.findIndex(t => {
          const targetId = t._id?.$oid || t._id;
          const editingId = editingTarget._id?.$oid || editingTarget._id;
          return targetId === editingId;
        });
        
        if (targetIndex !== -1) {
          // Preserve the _id and completed status
          targetData._id = editingTarget._id;
          targetData.completed = editingTarget.completed || false;
          targetData.completedAt = editingTarget.completedAt || null;
          updatedTargets[targetIndex] = targetData;
        }
      } else {
        // Add new target
        updatedTargets.push(targetData);
      }
      
      // Send updated targets array
      updateTargetsMutation.mutate(updatedTargets);
    }
  };

  const handleToggleTargetCompletion = (targetId, completed) => {
    if (!project || !project.targets) return;
    
    // Create a copy of the current targets
    let updatedTargets = [...project.targets];
    
    // Find the target
    const targetIndex = updatedTargets.findIndex(t => {
      const currId = t._id?.$oid || t._id;
      return currId === targetId;
    });
    
    if (targetIndex !== -1) {
      // Toggle completion
      updatedTargets[targetIndex] = {
        ...updatedTargets[targetIndex],
        completed: !completed,
        completedAt: !completed ? new Date() : null
      };
      
      // Send updated targets array
      updateTargetsMutation.mutate(updatedTargets);
    }
  };
  
  // Helper function to get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };
  
  // Helper function to format date
  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    if (dateObj.$date) {
      return new Date(dateObj.$date).toLocaleDateString();
    }
    return new Date(dateObj).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!projectId || projectId === 'undefined') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Invalid project ID
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            The project ID is missing or invalid
          </Typography>
          <Button onClick={() => navigate('/teacher/projects')} sx={{ mt: 2 }}>
            Back to Projects
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Project not found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            The requested project could not be found
          </Typography>
          <Button onClick={() => navigate('/teacher/projects')} sx={{ mt: 2 }}>
            Back to Projects
          </Button>
        </Paper>
      </Box>
    );
  }

  const projectUpdates = updates || [];
  const recentUpdates = projectUpdates.slice(0, 10);
  const progressPercentage = project.progress || 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/teacher/projects')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom>
            {project.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Project Details & Management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<TrendingUp />}
            onClick={openProgressDialog}
            color="primary"
          >
            Update Progress
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={openEditDialog}
          >
            Edit Project
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Project Overview */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Overview
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" paragraph>
                  {project.description}
                </Typography>
                
                {project.requirements && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Requirements:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {project.requirements}
                    </Typography>
                  </Box>
                )}
                
                {project.duration && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Duration:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {project.duration}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Project Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="bold">
                    {progressPercentage}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progressPercentage}
                  color={progressPercentage >= 80 ? 'success' : progressPercentage >= 50 ? 'warning' : 'error'}
                  sx={{ height: 8, borderRadius: 2, mb: 1 }}
                />
              </Box>

              {/* Project Targets */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">
                    Project Targets
                  </Typography>
                  <Button 
                    size="small" 
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => openTargetDialog()}
                  >
                    Add Target
                  </Button>
                </Box>

                {project.targets && project.targets.length > 0 ? (
                  <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                    <List dense sx={{ p: 0 }}>
                      {project.targets.map((target, index) => {
                        const targetId = target._id?.$oid || target._id;
                        const completed = target.completed || false;
                        const dueDate = target.dueDate?.$date ? new Date(target.dueDate.$date) : null;
                        const isPastDue = dueDate && new Date() > dueDate && !completed;
                        
                        return (
                          <React.Fragment key={targetId || index}>
                            <ListItem 
                              sx={{
                                px: 2,
                                py: 1.5,
                                bgcolor: completed ? 'success.light' : 
                                         isPastDue ? 'error.light' : 'transparent',
                                opacity: completed ? 0.8 : 1
                              }}
                              secondaryAction={
                                <Box>
                                  <IconButton 
                                    edge="end" 
                                    size="small"
                                    onClick={() => handleToggleTargetCompletion(targetId, completed)}
                                  >
                                    {completed ? 
                                      <CheckCircle color="success" /> : 
                                      <RadioButtonUnchecked color="action" />
                                    }
                                  </IconButton>
                                  <IconButton 
                                    edge="end" 
                                    size="small"
                                    onClick={() => openTargetDialog(target)}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Box>
                              }
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1" sx={{ 
                                      textDecoration: completed ? 'line-through' : 'none'
                                    }}>
                                      {target.title}
                                    </Typography>
                                    <Chip 
                                      size="small" 
                                      color={getPriorityColor(target.priority)}
                                      label={target.priority} 
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    {target.description && (
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        {target.description}
                                      </Typography>
                                    )}
                                    {target.dueDate && (
                                      <Typography variant="caption" color={isPastDue ? "error" : "warning.main"}>
                                        Due: {formatDate(target.dueDate)}
                                        {isPastDue && " (Overdue)"}
                                      </Typography>
                                    )}
                                    {target.assignedStudents && target.assignedStudents.length > 0 && (
                                      <Box sx={{ mt: 0.5 }}>
                                        {target.assignedStudents.map((studentId, i) => {
                                          const studentIdStr = typeof studentId === 'object' ? (studentId.$oid || '') : studentId;
                                          const student = project.students?.find(s => {
                                            const sId = s._id?.$oid || s._id;
                                            return sId === studentIdStr;
                                          });
                                          
                                          return (
                                            <Chip
                                              key={studentIdStr || i}
                                              size="small"
                                              variant="outlined"
                                              label={student?.username || `Student ${i+1}`}
                                              sx={{ mr: 0.5, mb: 0.5 }}
                                            />
                                          );
                                        })}
                                      </Box>
                                    )}
                                    {completed && target.completedAt && (
                                      <Typography variant="caption" display="block" color="success.dark">
                                        Completed: {formatDate(target.completedAt)}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < project.targets.length - 1 && <Divider />}
                          </React.Fragment>
                        );
                      })}
                    </List>
                  </Paper>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      No targets created yet
                    </Typography>
                    <Button 
                      size="small"
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => openTargetDialog()}
                      sx={{ mt: 1 }}
                    >
                      Create First Target
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Assigned Students */}
              {project.students && project.students.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Assigned Students:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {project.students.map((student) => (
                      <Chip
                        key={student._id?.$oid || student._id}
                        avatar={<Avatar>{student.username.charAt(0).toUpperCase()}</Avatar>}
                        label={student.username}
                        variant="outlined"
                        onClick={() => navigate(`/teacher/students/${student._id?.$oid || student._id}`)}
                        clickable
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Project Statistics */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Group sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">Students</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {project.students?.length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Update sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="body2">Total Updates</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {projectUpdates.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Comment sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="body2">Commented</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {projectUpdates.filter(u => u.inchargeComment).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="body2">This Week</Typography>
                  </Box>
                  <Typography variant="h4" color="info.main">
                    {projectUpdates.filter(update => {
                      const updateDate = new Date(update.timestamp);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return updateDate >= weekAgo;
                    }).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Project Updates */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Updates ({recentUpdates.length})
              </Typography>
              
              {recentUpdates.length > 0 ? (
                <List>
                  {recentUpdates.map((update, index) => (
                    <React.Fragment key={update._id?.$oid || update._id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <Person />
                        </Avatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography component="span" variant="subtitle1">
                                {update.student.username}
                              </Typography>
                              <Typography component="span" variant="caption" color="text.secondary">
                                {new Date(update.timestamp).toLocaleDateString()}
                              </Typography>
                              {update.inchargeComment ? (
                                <Chip 
                                  icon={<CheckCircle />}
                                  label="Reviewed" 
                                  size="small" 
                                  color="success"
                                />
                              ) : (
                                <Chip 
                                  icon={<Comment />}
                                  label="Needs Review" 
                                  size="small" 
                                  color="warning"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Box component="span" sx={{ display: 'block', mb: 1 }}>
                                <strong>Update:</strong> {update.description}
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
                                  p: 1.5, 
                                  bgcolor: 'action.hover', 
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'success.light'
                                }}>
                                  <Box component="span" sx={{ display: 'block', color: 'success.dark' }}>
                                    <strong>Your Comment:</strong> {update.inchargeComment}
                                  </Box>
                                </Box>
                              )}
                              <Box sx={{ mt: 1 }}>
                                <Button
                                  size="small"
                                  variant={update.inchargeComment ? "outlined" : "contained"}
                                  startIcon={<Comment />}
                                  onClick={() => openCommentDialog(update)}
                                >
                                  {update.inchargeComment ? 'Edit Comment' : 'Add Comment'}
                                </Button>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentUpdates.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Update sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Updates Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Students haven't submitted any updates for this project
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Project Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
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
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration"
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
            onClick={handleUpdateProject}
            disabled={updateProjectMutation.isLoading}
            startIcon={<Save />}
          >
            {updateProjectMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog 
        open={commentDialog} 
        onClose={() => setCommentDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {selectedUpdate?.inchargeComment ? 'Edit Comment' : 'Add Comment'}
        </DialogTitle>
        <DialogContent>
          {selectedUpdate && (
            <Box>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Student: {selectedUpdate.student.username}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Update:</strong> {selectedUpdate.description}
                </Typography>
                {selectedUpdate.report && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Report:</strong> {selectedUpdate.report}
                  </Typography>
                )}
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your Comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Provide feedback on this update..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={!comment.trim() || addCommentMutation.isLoading}
            startIcon={<Comment />}
          >
            {addCommentMutation.isLoading ? 'Saving...' : 'Save Comment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alerts */}
      {updateProjectMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to update project. Please try again.
        </Alert>
      )}
      {addCommentMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to add comment. Please try again.
        </Alert>
      )}

      {/* Progress Dialog */}
      <Dialog
        open={progressDialog}
        onClose={() => setProgressDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Project Progress</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Current Progress: {progressForm.progress}%
            </Typography>
            <Box sx={{ px: 1 }}>
              <Slider
                value={progressForm.progress}
                onChange={(e, newValue) => setProgressForm({ progress: newValue })}
                valueLabelDisplay="auto"
                step={5}
                marks
                min={0}
                max={100}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">0% (Not Started)</Typography>
              <Typography variant="caption" color="text.secondary">100% (Completed)</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateProgress}
            disabled={updateProgressMutation.isLoading}
            startIcon={<Save />}
          >
            {updateProgressMutation.isLoading ? 'Saving...' : 'Save Progress'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Target Dialog */}
      <Dialog
        open={targetDialog}
        onClose={() => setTargetDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTarget ? 'Edit Target' : 'Add New Target'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Target Title"
                value={targetForm.title}
                onChange={(e) => setTargetForm({ ...targetForm, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description (Optional)"
                value={targetForm.description}
                onChange={(e) => setTargetForm({ ...targetForm, description: e.target.value })}
                placeholder="Add details about this target..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={targetForm.priority}
                onChange={(e) => setTargetForm({ ...targetForm, priority: e.target.value })}
              >
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date (Optional)"
                value={targetForm.dueDate}
                onChange={(e) => setTargetForm({ ...targetForm, dueDate: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="assigned-students-label">Assigned Students</InputLabel>
                <Select
                  labelId="assigned-students-label"
                  multiple
                  value={targetForm.assignedStudents}
                  onChange={(e) => setTargetForm({ ...targetForm, assignedStudents: e.target.value })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((studentId) => {
                        const student = project.students?.find(s => {
                          const sId = s._id?.$oid || s._id;
                          return sId === studentId;
                        });
                        return (
                          <Chip 
                            key={studentId} 
                            label={student?.username || "Student"} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {project.students?.map((student) => {
                    const studentId = student._id?.$oid || student._id;
                    return (
                      <MenuItem key={studentId} value={studentId}>
                        {student.username || student.name || "Student"}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTargetDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveTarget}
            disabled={!targetForm.title.trim() || updateTargetsMutation.isLoading}
            startIcon={<Save />}
          >
            {updateTargetsMutation.isLoading ? 'Saving...' : (editingTarget ? 'Update Target' : 'Add Target')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alerts for Tasks and Progress */}
      {updateProgressMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to update progress. Please try again.
        </Alert>
      )}
      {updateTargetsMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to update project targets. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default TeacherProjectDetails;
