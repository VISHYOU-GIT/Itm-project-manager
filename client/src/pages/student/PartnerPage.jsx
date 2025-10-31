import React, { useState } from 'react';
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Paper,
  CircularProgress,
  Divider,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  People,
  PersonAdd,
  Email,
  Search,
  Group,
  School,
  Send,
  CheckCircle,
  Pending,
  Cancel,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentAPI } from '../../utils/api';

const PartnerPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [requestDialog, setRequestDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const queryClient = useQueryClient();

  // Get available students
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['available-students', searchQuery],
    queryFn: () => studentAPI.getAvailableStudents(searchQuery),
    select: (response) => response.data,
  });

  // Get current partner info
  const { data: profile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: studentAPI.getProfile,
    select: (response) => response.data,
  });

  // Get partner requests
  const { data: requests } = useQuery({
    queryKey: ['partner-requests'],
    queryFn: studentAPI.getPartnerRequests,
    select: (response) => response.data,
  });

  // Send partner request mutation
  const sendRequestMutation = useMutation({
    mutationFn: (data) => studentAPI.sendPartnerRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['available-students'] });
      setRequestDialog(false);
      setSelectedStudent(null);
      setRequestMessage('');
    },
    onError: (error) => {
      console.error('Send request error:', error);
    },
  });

  // Respond to partner request
  const respondRequestMutation = useMutation({
    mutationFn: (data) => studentAPI.respondToPartnerRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      queryClient.invalidateQueries({ queryKey: ['available-students'] });
    },
  });

  const handleSendRequest = () => {
    if (selectedStudent) {
      const requestData = {
        partnerId: selectedStudent._id,
        message: requestMessage?.trim() || 'Hi, I would like to partner with you for the project.',
      };
      sendRequestMutation.mutate(requestData);
    }
  };

  const handleRequestResponse = (requestId, action) => {
    respondRequestMutation.mutate({ requestId, action });
  };

  const openRequestDialog = (student) => {
    setSelectedStudent(student);
    setRequestMessage(`Hi ${student.username || 'there'}, I would like to partner with you for the project. Let's collaborate and create something amazing together!`);
    setRequestDialog(true);
  };

  const currentPartners = profile?.student?.partners || [];
  
  // Handle partner requests data
  const allRequests = requests?.requests || [];
  
  // NEW LOGIC: If type field exists, use it. Otherwise, treat all requests as received requests
  // (since the API returns requests for the current student)
  const sentRequests = allRequests.filter(req => req.type === 'sent') || [];
  
  // For received requests: either has type='received' OR no type field (fallback for old data)
  const receivedRequests = allRequests.filter(req => 
    req.type === 'received' || (!req.type && req.status === 'pending')
  ) || [];
  
  const availableStudents = students?.students?.filter(student => 
    student?._id !== profile?.student?._id && 
    !currentPartners.find(partner => partner._id === student?._id) &&
    !sentRequests.find(req => req.student?._id === student?._id) &&
    student?.partners?.length < 4 // Only show students who haven't reached the limit
  ) || [];

  const canAddPartners = currentPartners.length < 4;

  if (studentsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Project Partners ({currentPartners.length}/4)
      </Typography>

      {currentPartners.length > 0 ? (
        // Current Partners Section  
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Group sx={{ mr: 1 }} />
              Current Partners ({currentPartners.length})
            </Typography>
            <Grid container spacing={2}>
              {currentPartners.map((partner, index) => (
                <Grid item xs={12} sm={6} md={3} key={partner._id?.$oid || partner._id}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                        {partner.username?.charAt(0)?.toUpperCase() || 'P'}
                      </Avatar>
                      <Typography variant="h6">{partner.username || 'Unknown Partner'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {partner.rollNo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Email sx={{ fontSize: 16 }} />
                        {partner.email || 'No email'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <School sx={{ fontSize: 16 }} />
                        {partner.department || 'MCA'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {!canAddPartners && (
              <Alert severity="info" sx={{ mt: 2 }}>
                You have reached the maximum number of partners (4). Cannot add more partners.
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : canAddPartners ? (
        <Grid container spacing={3}>
          {/* Search Available Students */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Find Partners ({currentPartners.length}/4)
                </Typography>
                {!canAddPartners && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    You have reached the maximum limit of 4 partners.
                  </Alert>
                )}
                <TextField
                  fullWidth
                  placeholder="Search students by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                  disabled={!canAddPartners}
                />
                
                {availableStudents.length > 0 ? (
                  <List>
                    {availableStudents.map((student) => (
                      <ListItem key={student._id?.$oid || student._id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {student.username?.charAt(0)?.toUpperCase() || 'S'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={student.username || 'Unknown Student'}
                          secondary={
                            <Box>
                              <Typography component="div" variant="body2" color="text.secondary">
                                {student.email || 'No email'} • {student.rollNo}
                              </Typography>
                              <Typography component="div" variant="body2" color="text.secondary">
                                {student.department || 'MCA'} • {student.class || 'Student'}
                              </Typography>
                              <Typography component="div" variant="body2" color="primary.main">
                                Partners: {student.partners?.length || 0}/4
                              </Typography>
                            </Box>
                          }
                        />
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PersonAdd />}
                          onClick={() => openRequestDialog(student)}
                          disabled={sendRequestMutation.isLoading || !canAddPartners}
                        >
                          Send Request
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Available Students
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery 
                        ? 'No students found matching your search'
                        : 'All students already have maximum partners or there are no students available'
                      }
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Requests Section */}
          <Grid item xs={12} md={4}>
            {/* Sent Requests */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sent Requests ({sentRequests.length})
                </Typography>
                {sentRequests.length > 0 ? (
                  <List sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {sentRequests.map((request) => (
                      <ListItem key={request._id?.$oid || request._id} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                            {request.student?.username?.charAt(0)?.toUpperCase() || 'R'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography component="div" variant="body2">
                              {request.student?.username || 'Unknown User'}
                            </Typography>
                          }
                          secondary={
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
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    No sent requests
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Received Requests */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Received Requests ({receivedRequests.length})
                </Typography>
                {receivedRequests.length > 0 ? (
                  <List>
                    {receivedRequests.map((request) => (
                      <ListItem key={request._id?.$oid || request._id} sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 1 }}>
                            {request.student?.username?.charAt(0)?.toUpperCase() || 'R'}
                          </Avatar>
                          <Typography variant="body2">
                            {request.student?.username || 'Unknown User'}
                          </Typography>
                        </Box>
                        {request.message && (
                          <Box sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {request.message}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleRequestResponse(request._id, 'accept')}
                            disabled={respondRequestMutation.isLoading}
                          >
                            Accept
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleRequestResponse(request._id, 'reject')}
                            disabled={respondRequestMutation.isLoading}
                          >
                            Decline
                          </Button>
                        </Box>
                        <Divider sx={{ mt: 1 }} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    No pending requests
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Card>
          <CardContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              You have reached the maximum limit of 4 partners.
            </Alert>
            <Typography variant="h6" gutterBottom>
              Partner Limit Reached
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You already have 4 partners, which is the maximum allowed. 
              If you need to change partners, please contact your administrator.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Send Request Dialog */}
      <Dialog open={requestDialog} onClose={() => setRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Send Partner Request
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {selectedStudent.username?.charAt(0)?.toUpperCase() || 'S'}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedStudent.username || 'Unknown Student'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedStudent.email || 'No email'}
                  </Typography>
                </Box>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message (Optional)"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Add a personal message to your partner request..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendRequest}
            disabled={sendRequestMutation.isLoading || !selectedStudent}
            startIcon={<Send />}
          >
            {sendRequestMutation.isLoading ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      {sendRequestMutation.isSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Partner request sent successfully!
        </Alert>
      )}
      {sendRequestMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to send partner request: {sendRequestMutation.error?.response?.data?.error || sendRequestMutation.error?.message || 'Please try again'}
        </Alert>
      )}
      {respondRequestMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to respond to request. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default PartnerPage;
