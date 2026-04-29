import React, {createContext, useState, useEffect} from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children})=>{
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const savedToken = sessionStorage.getItem('token');
    const savedUser = JSON.parse(sessionStorage.getItem('user'));

    if(savedToken && savedUser){
      setToken(savedToken);
      setUser(savedUser);
    }
    setLoading(false);
  },[]);

  const login = (newToken, userData) =>{
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () =>{
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return(
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};