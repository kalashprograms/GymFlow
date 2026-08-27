import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Gym } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  gym: Gym | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, gymName?: string) => Promise<void>;
  logout: () => void;
  updateGymState: (gym: Gym) => void;
  updateUserState: (user: User) => void;
  reloadAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCurrentUser = async () => {
    try {
      const data = await api.getMe();
      if (data.user) {
        setUser(data.user);
        setGym(data.gym);
        localStorage.setItem('gymflow_gym_id', data.gym?.id || 'gym_ironpulse_01');
      }
    } catch (err) {
      console.warn('No active session found, prompting login or demo state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const login = async (email: string, password: string, rememberMe = true) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password, rememberMe });
      setUser(res.user);
      setGym(res.gym);
      localStorage.setItem('gymflow_token', res.token);
      localStorage.setItem('gymflow_gym_id', res.gym?.id || 'gym_ironpulse_01');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, gymName?: string) => {
    setIsLoading(true);
    try {
      const res = await api.register({ name, email, password, gymName });
      setUser(res.user);
      setGym(res.gym);
      localStorage.setItem('gymflow_token', res.token);
      localStorage.setItem('gymflow_gym_id', res.gym?.id || 'gym_ironpulse_01');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setGym(null);
    localStorage.removeItem('gymflow_token');
  };

  const updateGymState = (updatedGym: Gym) => {
    setGym(updatedGym);
  };

  const updateUserState = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const reloadAuth = async () => {
    await loadCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        gym,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateGymState,
        updateUserState,
        reloadAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
