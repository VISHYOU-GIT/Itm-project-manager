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
  Tabs,
  Tab,
  Badge,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Update,
  Comment,
  AccessTime,
  FilterList,
  Search,
  Send,
  CheckCircle,
  Assignment,
  Person,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherAPI } from '../../utils/api';

const TeacherUpdates = () => {
  const [tabValue, setTabValue] = useState(0);
  const [commentDialog, setCommentDialog] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [comment, setComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  // Get all student updates for teacher
  const { data: updates, isLoading } = useQuery({
    queryKey: ['teacher-student-updates'],
    queryFn: teacherAPI.getStudentUpdates,
    select: (response) => response.data.updates,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (data) => teacherAPI.addUpdateComment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-student-updates'] });
      setCommentDialog(false);
      setSelectedUpdate(null);
      setComment('');
    },
  });

  const handleAddComment = () => {
    if (selectedUpdate && comment.trim()) {
      addCommentMutation.mutate({
        updateId: selectedUpdate._id,
        comment: comment.trim(),
      });
    }
  };

  const openCommentDialog = (update) => {
    setSelectedUpdate(update);
    setComment(update.inchargeComment || '');
    setCommentDialog(true);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // Filter updates based on search and status
  const filteredUpdates = updates?.filter(update => {
    const matchesSearch = !searchQuery || 
      update.student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.report?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'commented' && update.inchargeComment) ||
      (filterStatus === 'uncommented' && !update.inchargeComment);
    
    return matchesSearch && matchesFilter;
  }) || [];

  const recentUpdates = filteredUpdates.slice(0, 20);
  const commentedUpdates = filteredUpdates.filter(update => update.inchargeComment);
  const uncommentedUpdates = filteredUpdates.filter(update => !update.inchargeComment);

  const getTabContent = () => {
    switch (tabValue) {
      case 0: return recentUpdates;
      case 1: return uncommentedUpdates;
      case 2: return commentedUpdates;
      default: return recentUpdates;
    }
  };

  const currentUpdates = getTabContent();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Student Updates
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Update sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">Total Updates</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {updates?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Comment sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2">Commented</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {commentedUpdates.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTime sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="body2">Pending Review</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {uncommentedUpdates.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search updates by student name, description, or report..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Filter by Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                  startAdornment={<FilterList />}
                >
                  <MenuItem value="all">All Updates</MenuItem>
                  <MenuItem value="uncommented">Need Review</MenuItem>
                  <MenuItem value="commented">Reviewed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab 
              label={
                <Badge badgeContent={recentUpdates.length} color="primary">
                  Recent Updates
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={uncommentedUpdates.length} color="warning">
                  Pending Review
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={commentedUpdates.length} color="success">
                  Reviewed
                </Badge>
              } 
            />
          </Tabs>
        </Box>

        <CardContent>
          {currentUpdates.length > 0 ? (
            <List>
              {currentUpdates.map((update, index) => (
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
                              icon={<AccessTime />}
                              label="Pending Review" 
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
                              <strong>Report:</strong> {update.report.length > 150 
                                ? `${update.report.substring(0, 150)}...` 
                                : update.report
                              }
                            </Box>
                          )}
                          {update.inchargeComment && (
                            <Box sx={{ 
                              mt: 1, 
                              p: 2, 
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
                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
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
                  {index < currentUpdates.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Update sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Updates Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No student updates available yet'
                }
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

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
                helperText="Your comment will be visible to the student"
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
            startIcon={<Send />}
          >
            {addCommentMutation.isLoading ? 'Saving...' : 'Save Comment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherUpdates;
