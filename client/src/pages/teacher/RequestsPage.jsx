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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import {
  PersonAdd,
  Group,
  CheckCircle,
  Cancel,
  Pending,
  Send,
  Person,
  Assignment,
  Message,
  AccessTime,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherAPI } from '../../utils/api';

const TeacherRequests = () => {
  const [tabValue, setTabValue] = useState(0);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const queryClient = useQueryClient();

  // Get incharge requests
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['teacher-requests'],
    queryFn: teacherAPI.getInchargeRequests,
    select: (response) => response.data.requests,
  });

  // Get teacher's projects
  const { data: projects } = useQuery({
    queryKey: ['teacher-projects'],
    queryFn: teacherAPI.getAssignedProjects,
    select: (response) => response.data.projects,
  });

  // Respond to request mutation
  const respondRequestMutation = useMutation({
    mutationFn: (data) => teacherAPI.respondToInchargeRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-requests'] });
      setAssignDialog(false);
      setSelectedRequest(null);
      setSelectedProject('');
      setResponseMessage('');
    },
  });

  const handleAcceptRequest = (request) => {
    setSelectedRequest(request);
    setResponseMessage(`Hi ${request.student.username}, I'm happy to be your project incharge! Let's work together to make your project successful.`);
    setAssignDialog(true);
  };

  const handleRejectRequest = (request) => {
    respondRequestMutation.mutate({
      requestId: request._id,
      status: 'rejected',
      message: 'Thank you for considering me, but I am unable to take on additional projects at this time.',
    });
  };

  const handleConfirmAccept = () => {
    if (selectedRequest) {
      respondRequestMutation.mutate({
        requestId: selectedRequest._id,
        status: 'accepted',
        projectId: selectedProject || null,
        message: responseMessage.trim(),
      });
    }
  };

  if (requestsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const pendingRequests = requests?.filter(req => req.status === 'pending') || [];
  const acceptedRequests = requests?.filter(req => req.status === 'accepted') || [];
  const rejectedRequests = requests?.filter(req => req.status === 'rejected') || [];

  const getTabContent = () => {
    switch (tabValue) {
      case 0: return pendingRequests;
      case 1: return acceptedRequests;
      case 2: return rejectedRequests;
      default: return pendingRequests;
    }
  };

  const currentRequests = getTabContent();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Incharge Requests
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Pending sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="body2">Pending Requests</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {pendingRequests.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2">Accepted</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {acceptedRequests.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Cancel sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="body2">Rejected</Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {rejectedRequests.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Requests Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab 
              label={
                <Badge badgeContent={pendingRequests.length} color="warning">
                  Pending
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={acceptedRequests.length} color="success">
                  Accepted
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={rejectedRequests.length} color="error">
                  Rejected
                </Badge>
              } 
            />
          </Tabs>
        </Box>

        <CardContent>
          {currentRequests.length > 0 ? (
            <List>
              {currentRequests.map((request, index) => (
                <React.Fragment key={request._id?.$oid || request._id}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography component="span" variant="subtitle1">
                            {request.student.username}
                          </Typography>
                          <Typography component="span" variant="caption" color="text.secondary">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </Typography>
                          <Chip
                            label={request.status}
                            size="small"
                            color={
                              request.status === 'accepted' ? 'success' :
                              request.status === 'rejected' ? 'error' : 'warning'
                            }
                            icon={
                              request.status === 'accepted' ? <CheckCircle /> :
                              request.status === 'rejected' ? <Cancel /> : <Pending />
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box component="span" sx={{ display: 'block', color: 'text.secondary', mb: 1 }}>
                            <strong>Email:</strong> {request.student.email}
                          </Box>
                          
                          {request.message && (
                            <Box sx={{ 
                              mb: 1, 
                              p: 1.5, 
                              bgcolor: 'grey.50', 
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'grey.200'
                            }}>
                              <Box component="span" sx={{ display: 'block', fontWeight: 'bold' }}>
                                Student's Message:
                              </Box>
                              <Box component="span" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                                {request.message}
                              </Box>
                            </Box>
                          )}

                          {request.teacherResponse && (
                            <Box sx={{ 
                              mb: 1, 
                              p: 1.5, 
                              bgcolor: request.status === 'accepted' ? 'action.hover' : 'error.lighter',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: request.status === 'accepted' ? 'success.light' : 'error.light'
                            }}>
                              <Box component="span" sx={{ 
                                display: 'block', 
                                color: request.status === 'accepted' ? 'success.dark' : 'error.dark',
                                fontWeight: 'bold'
                              }}>
                                Your Response:
                              </Box>
                              <Box component="span" sx={{ 
                                display: 'block', 
                                color: request.status === 'accepted' ? 'success.dark' : 'error.dark',
                                mt: 0.5 
                              }}>
                                {request.teacherResponse}
                              </Box>
                            </Box>
                          )}

                          {request.status === 'pending' && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => handleAcceptRequest(request)}
                                disabled={respondRequestMutation.isLoading}
                              >
                                Accept
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<Cancel />}
                                onClick={() => handleRejectRequest(request)}
                                disabled={respondRequestMutation.isLoading}
                              >
                                Reject
                              </Button>
                            </Box>
                          )}

                          {request.status === 'accepted' && request.project && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="success.main">
                                <Assignment sx={{ fontSize: 16, mr: 0.5 }} />
                                <strong>Assigned Project:</strong> {request.project.name}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < currentRequests.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              {tabValue === 0 && (
                <>
                  <Pending sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Pending Requests
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You don't have any pending incharge requests at the moment
                  </Typography>
                </>
              )}
              {tabValue === 1 && (
                <>
                  <CheckCircle sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Accepted Requests
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You haven't accepted any incharge requests yet
                  </Typography>
                </>
              )}
              {tabValue === 2 && (
                <>
                  <Cancel sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Rejected Requests
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You haven't rejected any incharge requests
                  </Typography>
                </>
              )}
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Accept Request Dialog */}
      <Dialog 
        open={assignDialog} 
        onClose={() => setAssignDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Accept Incharge Request
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Student: {selectedRequest.student.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email: {selectedRequest.student.email}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Assign to Project (Optional)</InputLabel>
                    <Select
                      value={selectedProject}
                      label="Assign to Project (Optional)"
                      onChange={(e) => setSelectedProject(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>No Project Assignment</em>
                      </MenuItem>
                      {projects?.map((project) => (
                        <MenuItem key={project._id?.$oid || project._id} value={project._id?.$oid || project._id}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Response Message"
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Write a welcome message to the student..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmAccept}
            disabled={respondRequestMutation.isLoading}
            startIcon={<Send />}
          >
            {respondRequestMutation.isLoading ? 'Accepting...' : 'Accept Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alert */}
      {respondRequestMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to respond to request. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default TeacherRequests;
