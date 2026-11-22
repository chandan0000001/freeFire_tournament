import useLiveRefresh from '../hooks/useLiveRefresh.js';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('re_token') || localStorage.getItem('rit_token');
    if (!token) {
      setUser(null);
      setWallet(null);
      return null;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        setWallet(res.wallet || null);
        return res;
      } else {
        localStorage.removeItem('re_token');
        localStorage.removeItem('rit_token');
        setUser(null);
        setWallet(null);
        return null;
      }
    } catch (err) {
      if ([401, 403].includes(err.status)) {
        localStorage.removeItem('re_token');
        localStorage.removeItem('rit_token');
        setUser(null);
        setWallet(null);
      }
      return null;
    }
  }, []);

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
            setWallet(res.wallet || null);
          } else {
            localStorage.removeItem('re_token');
            localStorage.removeItem('rit_token');
            setUser(null);
            setWallet(null);
          }
        }
      } catch (err) {
        if (isMounted && [401, 403].includes(err.status)) {
          localStorage.removeItem('re_token');
          localStorage.removeItem('rit_token');
          setUser(null);
          setWallet(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkAuth();
    return () => { isMounted = false; };
  }, []);

  const login = useCallback(async (endpointOrCredentials, credentialsIfEndpoint) => {
    let endpoint = '/auth/login';
    let payload = endpointOrCredentials;

    if (typeof endpointOrCredentials === 'string') {
      endpoint = endpointOrCredentials;
      payload = credentialsIfEndpoint;
    }

    const res = await api.post(endpoint, payload);
    if (res.success && res.token) {
      localStorage.setItem('re_token', res.token);
      localStorage.setItem('rit_token', res.token);
      setUser(res.user);
      setWallet(res.wallet || null);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  }, []);

  const register = useCallback(async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.success && res.token) {
      localStorage.setItem('re_token', res.token);
      localStorage.setItem('rit_token', res.token);
      setUser(res.user);
      setWallet(res.wallet || null);
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  }, []);

  useLiveRefresh(refreshUser);

  const logout = useCallback(() => {
    localStorage.removeItem('re_token');
    localStorage.removeItem('rit_token');
    setUser(null);
    setWallet(null);
  }, []);

  const isAdmin = useMemo(() => {
    return Boolean(user && ['superadmin', 'admin'].includes(user.role));
  }, [user]);

  const isPlayer = useMemo(() => {
    return Boolean(user && user.role === 'player');
  }, [user]);

  const value = useMemo(() => ({
    user,
    wallet,
    setWallet,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAdmin,
    isPlayer,
  }), [user, wallet, loading, login, register, logout, refreshUser, isAdmin, isPlayer]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
