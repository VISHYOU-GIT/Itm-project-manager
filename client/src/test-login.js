// Simple test to check if API calls work
import axios from 'axios';

const testLogin = async () => {
  try {
    console.log('Testing login...');
    
    const response = await axios.post('https://server-amber-two-95.vercel.app/api/auth/student/login', {
      rollNo: 'MCA2023001',
      password: 'password123'
    });
    
    console.log('Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

// Test the login
testLogin();
