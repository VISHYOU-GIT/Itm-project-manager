import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  Alert,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Fade,
  CircularProgress,
  Link,
} from '@mui/material';
import {
  School,
  Person,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { authAPI } from '../utils/api';
import useAuthStore from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`auth-tabpanel-${index}`}
    aria-labelledby={`auth-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const AuthPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isRegister, setIsRegister] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const loginMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Login attempt with data:', data);
      const { userType, ...loginData } = data;
      let response;
      
      switch (userType) {
        case 'student':
          response = await authAPI.loginStudent(loginData);
          break;
        case 'teacher':
          response = await authAPI.loginTeacher(loginData);
          break;
        case 'admin':
          response = await authAPI.loginAdmin(loginData);
          break;
        default:
          throw new Error('Invalid user type');
      }
      
      console.log('Login response:', response);
      return response;
    },
    onSuccess: (response) => {
        console.log('Login successful, response data:', response.data);
        console.log('About to call login with:', response.data);
        login(response.data);
        console.log('Login called, user stored. Auth state updated.');
        toast.success('Login successful!');
        
        // Small delay to ensure state is updated, then navigate
        setTimeout(() => {
          console.log('Navigating to dashboard...');
          navigate('/dashboard', { replace: true });
        }, 100);
      },
      onError: (error) => {
        console.error('Login error:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Login failed';
        toast.error(errorMessage);
      },
    });

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Register attempt with data:', data);
      const { userType, ...registerData } = data;
      let response;
      
      switch (userType) {
        case 'student':
          response = await authAPI.registerStudent(registerData);
          break;
        case 'teacher':
          response = await authAPI.registerTeacher(registerData);
          break;
        default:
          throw new Error('Invalid user type');
      }
      
      console.log('Register response:', response);
      return response;
    },
    onSuccess: (response) => {
      console.log('Registration successful, response data:', response.data);
      console.log('About to call login with:', response.data);
      login(response.data);
      console.log('Registration login called, auth state updated.');
      toast.success('Registration successful!');
      
      // Small delay to ensure state is updated, then navigate
      setTimeout(() => {
        console.log('Navigating to dashboard...');
        navigate('/dashboard', { replace: true });
      }, 100);
    },
    onError: (error) => {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      toast.error(errorMessage);
    },
  });

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    const formData = { ...data, userType: ['student', 'teacher', 'admin'][tabValue] };
    console.log('Processed form data:', formData);
    
    try {
      if (isRegister && tabValue !== 2) {
        console.log('Attempting registration...');
        await registerMutation.mutateAsync(formData);
      } else {
        console.log('Attempting login...');
        await loginMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

const handleTabChange = (event, newValue) => {
  setTabValue(newValue);
  setIsRegister(false);
  reset();
};

const tabs = [
  { label: 'Student', icon: <Person />, color: '#1976d2' },
  { label: 'Teacher', icon: <School />, color: '#2e7d32' },
  { label: 'Admin', icon: <AdminPanelSettings />, color: '#d32f2f' },
];

return (
  <Box
    sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
    }}
  >
    <Container maxWidth="md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Grid container>
            {/* Left Side - Branding */}
            <Grid
              item
              xs={12}
              md={5}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                color: 'white',
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                  }}
                >
                  <School sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                  ITM Project Manager
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Streamline your project management with our comprehensive platform designed for students, teachers, and administrators.
                </Typography>
              </motion.div>
            </Grid>

            {/* Right Side - Form */}
            <Grid item xs={12} md={7}>
              <Box sx={{ p: 4 }}>
                {/* Debug Test Button */}
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      console.log('Testing direct API call...');
                      try {
                        const response = await authAPI.loginStudent({
                          rollNo: 'MCA2023001',
                          password: 'password123'
                        });
                        console.log('Direct API test success:', response.data);
                        login(response.data);
                        toast.success('Direct API test successful!');
                        navigate('/dashboard', { replace: true });
                      } catch (error) {
                        console.error('Direct API test failed:', error);
                        toast.error('Direct API test failed: ' + error.message);
                      }
                    }}
                  >
                    Test Direct API Call
                  </Button>
                </Box>

                <Typography
                  variant="h5"
                  gutterBottom
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="center"
                  mb={3}
                >
                  {isRegister ? 'Create Account' : 'Welcome Back'}
                </Typography>

                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{
                    mb: 3,
                    '& .MuiTab-root': {
                      minHeight: 60,
                      textTransform: 'none',
                      fontWeight: 500,
                    },
                  }}
                >
                  {tabs.map((tab, index) => (
                    <Tab
                      key={index}
                      icon={tab.icon}
                      label={tab.label}
                      iconPosition="start"
                      sx={{
                        color: tabValue === index ? tab.color : 'text.secondary',
                      }}
                    />
                  ))}
                </Tabs>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    console.log('Form submit event triggered');
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData);
                    console.log('Form data:', data);
                    onSubmit(data);
                  }}
                  onInvalid={(e) => console.log('Form invalid:', e)}
                  noValidate
                >
                  <TabPanel value={tabValue} index={0}>
                    {/* Student Form */}
                    {isRegister ? (
                      <>
                        <TextField
                          fullWidth
                          label="Roll Number"
                          name="rollNo"
                          variant="outlined"
                          margin="normal"
                          required
                        />
                        <TextField
                          fullWidth
                          label="Username"
                          name="username"
                          variant="outlined"
                          margin="normal"
                          required
                        />
                        <TextField
                          fullWidth
                          label="Department"
                          name="department"
                          variant="outlined"
                          margin="normal"
                          required
                        />
                        <TextField
                          fullWidth
                          label="Class"
                          name="class"
                          variant="outlined"
                          margin="normal"
                          required
                        />
                      </>
                    ) : (
                      <TextField
                        fullWidth
                        label="Roll Number"
                        name="rollNo"
                        variant="outlined"
                        margin="normal"
                        required
                      />
                    )}
                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type="password"
                      variant="outlined"
                      margin="normal"
                      required
                    />
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                    {/* Teacher Form */}
                    {isRegister ? (
                      <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        variant="outlined"
                        margin="normal"
                        required
                      />
                    ) : null}
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      variant="outlined"
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type="password"
                      variant="outlined"
                      margin="normal"
                      required
                    />
                  </TabPanel>

                  <TabPanel value={tabValue} index={2}>
                    {/* Admin Form */}
                    <TextField
                      fullWidth
                      label="Admin ID"
                      name="adminId"
                      variant="outlined"
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type="password"
                      variant="outlined"
                      margin="normal"
                      required
                    />
                  </TabPanel>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loginMutation.isLoading || registerMutation.isLoading}
                    onClick={() => console.log('Sign in button clicked!')}
                    sx={{
                      mt: 3,
                      mb: 2,
                      py: 1.5,
                      backgroundColor: tabs[tabValue].color,
                      '&:hover': {
                        backgroundColor: tabs[tabValue].color,
                        opacity: 0.9,
                      },
                    }}
                  >
                    {(loginMutation.isLoading || registerMutation.isLoading) && (
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                    )}
                    {isRegister ? 'Create Account' : 'Sign In'}
                  </Button>

                  {tabValue !== 2 && (
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <Link
                          component="button"
                          type="button"
                          onClick={() => {
                            setIsRegister(!isRegister);
                            reset();
                          }}
                          sx={{ textDecoration: 'none', color: tabs[tabValue].color }}
                        >
                          {isRegister ? 'Sign In' : 'Sign Up'}
                        </Link>
                      </Typography>
                    </Box>
                  )}
                </form>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>
    </Container>
  </Box>
);
};

export default AuthPage;
