import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setTokenState(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const setToken = (newToken) => {
    setTokenState(newToken);
    localStorage.setItem('access_token', newToken);
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    setToken(response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    const userResponse = await authAPI.getMe();
    setUser(userResponse.data);
    return userResponse.data;
  };

  const register = async (name, email, password, department) => {
    const response = await authAPI.register({ name, email, password, department });
    setToken(response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    const userResponse = await authAPI.getMe();
    setUser(userResponse.data);
    return userResponse.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setTokenState(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
