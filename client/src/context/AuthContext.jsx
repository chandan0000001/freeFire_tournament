import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      const token = localStorage.getItem('re_token') || localStorage.getItem('rit_token');
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (isMounted) {
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            localStorage.removeItem('re_token');
            localStorage.removeItem('rit_token');
            setUser(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          localStorage.removeItem('re_token');
          localStorage.removeItem('rit_token');
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkAuth();
    return () => { isMounted = false; };
  }, []);

  const login = useCallback(async (endpoint, credentials) => {
    const res = await api.post(endpoint, credentials);
    if (res.success && res.token) {
      localStorage.setItem('re_token', res.token);
      localStorage.setItem('rit_token', res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('re_token');
    localStorage.removeItem('rit_token');
    setUser(null);
  }, []);

  const isAdmin = useMemo(() => {
    return Boolean(user && ['superadmin', 'admin'].includes(user.role));
  }, [user]);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    isAdmin
  }), [user, loading, login, logout, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
