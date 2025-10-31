import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import axios from 'axios';

const APITest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      // Test health endpoint first
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('Health check:', healthResponse.data);
      
      // Test login endpoint
      const loginResponse = await axios.post('http://localhost:5000/api/auth/student/login', {
        rollNo: 'MCA2023001',
        password: 'password123'
      });
      console.log('Login response:', loginResponse.data);
      
      setResult(`Success! Login working. User: ${loginResponse.data.user.username}`);
    } catch (error) {
      console.error('API Test Error:', error);
      setResult(`Error: ${error.message} - ${error.response?.data?.error || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        API Connection Test
      </Typography>
      <Button 
        variant="contained" 
        onClick={testAPI} 
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Testing...' : 'Test API Connection'}
      </Button>
      {result && (
        <Alert severity={result.includes('Success') ? 'success' : 'error'}>
          {result}
        </Alert>
      )}
    </Box>
  );
};

export default APITest;
