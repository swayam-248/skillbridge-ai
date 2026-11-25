/* eslint-disable react-hooks/set-state-in-effect, react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

function parseJwt(token) {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('token');
    let savedUser = null;
    try {
      savedUser = JSON.parse(sessionStorage.getItem('user'));
    } catch (e) {
      savedUser = null;
    }

    if (savedToken) {
      const decoded = parseJwt(savedToken);
      const enrichedUser = {
        ...(savedUser || {}),
        _id: savedUser?._id || decoded?.userId,
        userId: savedUser?.userId || savedUser?._id || decoded?.userId,
        role: savedUser?.role || decoded?.role
      };
      setToken(savedToken);
      setUser(enrichedUser);
    }
    setLoading(false);
  }, []);

  const login = (newToken, userData) => {
    const decoded = parseJwt(newToken);
    const enrichedUser = {
      ...(userData || {}),
      _id: userData?._id || decoded?.userId,
      userId: userData?.userId || userData?._id || decoded?.userId,
      role: userData?.role || decoded?.role
    };

    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', JSON.stringify(enrichedUser));
    setToken(newToken);
    setUser(enrichedUser);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
