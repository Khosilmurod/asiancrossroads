import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  graduating_year: string;
  major: string;
  description: string;
  profile_picture: string;
  title: string;
  is_main: boolean;
}

interface LoginResponse {
  access: string;
  refresh: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  isAdmin: () => boolean;
  isPresident: () => boolean;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get<User>('http://localhost:8000/auth/profile/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await axios.post<LoginResponse>('http://localhost:8000/auth/login/', {
      username,
      password
    });
    localStorage.setItem('token', response.data.access);
    localStorage.setItem('refreshToken', response.data.refresh);
    await fetchUserProfile();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const register = async (userData: any): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token || (!isAdmin() && !isPresident())) {
      throw new Error('Unauthorized');
    }
    
    try {
      // Send the data with password2 included
      await axios.post('http://localhost:8000/auth/register/', userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isPresident = () => user?.role === 'PRESIDENT';

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      throw new Error('Unauthorized');
    }
    
    const response = await axios.patch<User>('http://localhost:8000/auth/profile/', data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    setUser(response.data);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      register, 
      isAdmin, 
      isPresident,
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 