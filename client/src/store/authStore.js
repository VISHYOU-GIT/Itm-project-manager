import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('auth-user') || 'null'),
  token: localStorage.getItem('auth-token') || null,
  isAuthenticated: !!localStorage.getItem('auth-token'),
  
  login: (userData) => {
    console.log('Auth Store: Login called with:', userData);
    localStorage.setItem('auth-user', JSON.stringify(userData.user));
    localStorage.setItem('auth-token', userData.token);
    
    set({
      user: userData.user,
      token: userData.token,
      isAuthenticated: true
    });
    
    console.log('Auth Store: State updated. User:', userData.user.username || userData.user.rollNo);
  },
  
  logout: () => {
    console.log('Auth Store: Logout called');
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-token');
    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  },
  
  updateUser: (userData) => {
    const updatedUser = { ...get().user, ...userData };
    localStorage.setItem('auth-user', JSON.stringify(updatedUser));
    set({
      user: updatedUser
    });
  }
}));

export default useAuthStore;
