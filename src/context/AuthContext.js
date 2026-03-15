import React, { createContext, useState, useContext, useEffect } from 'react';

// User roles
export const ROLES = {
  ADMIN: 'admin',
  CITIZEN: 'citizen',
};

// Feature permissions for each role
export const PERMISSIONS = {
  [ROLES.ADMIN]: [
    'view_dashboard',
    'view_map',
    'view_satellite',
    'scan_roads',
    'manage_incidents',
    'manage_tasks',
    'view_analytics',
    'manage_users',
    'export_data',
    'system_settings',
  ],
  [ROLES.CITIZEN]: [
    'view_dashboard',
    'view_map',
    'view_satellite',
    'report_issue',
    'view_incidents',
  ],
};

// Check if a role has a specific permission
export const hasPermission = (role, permission) => {
  const rolePermissions = PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
};

// Create Auth Context
const AuthContext = createContext(null);

// Sample users for demo
const SAMPLE_USERS = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@nwa.gov.jm',
    role: ROLES.ADMIN,
    avatar: '👨‍💼',
  },
  {
    id: '2',
    name: 'Citizen User',
    email: 'citizen@example.com',
    role: ROLES.CITIZEN,
    avatar: '👤',
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simulate checking for existing session
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // In a real app, you would check AsyncStorage or make an API call
      // For demo, we start unauthenticated
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoading(false);
    }
  };

  const login = async (email, password, role) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any login and use selected role
      const foundUser = SAMPLE_USERS.find(u => u.role === role) || {
        id: Date.now().toString(),
        name: role === ROLES.ADMIN ? 'Admin User' : 'Citizen User',
        email,
        role,
        avatar: role === ROLES.ADMIN ? '👨‍💼' : '👤',
      };
      
      setUser(foundUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Logout failed:', error);
    }
  };

  const switchRole = async (newRole) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Update user role
      const updatedUser = {
        ...user,
        role: newRole,
        avatar: newRole === ROLES.ADMIN ? '👨‍💼' : '👤',
        name: newRole === ROLES.ADMIN ? 'Admin User' : 'Citizen User',
      };
      
      setUser(updatedUser);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Role switch failed:', error);
    }
  };

  // Check if user has specific permission
  const canAccess = (permission) => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    switchRole,
    canAccess,
    hasPermission,
    ROLES,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
