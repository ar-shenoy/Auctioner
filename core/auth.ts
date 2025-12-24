
import { User, Role, RegistrationTokenPayload } from '../types';
import { toast } from 'react-hot-toast';
import api, { setAccessToken } from './api';

const USER_STORAGE_KEY = 'cricket-ops-user';

/**
 * Login with backend auth endpoint.
 * Calls POST /auth/login, stores token and user data.
 */
export const login = async (email: string, password: string): Promise<User | null> => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, user } = response.data;
    
    setAccessToken(access_token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  } catch (error: any) {
    const message = error.response?.data?.detail || 'Login failed';
    toast.error(message);
    return null;
  }
};

/**
 * Get current user from backend.
 * Calls GET /auth/me.
 */
export const getMe = async (): Promise<User | null> => {
  try {
    const response = await api.get('/auth/me');
    const user = response.data;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  } catch (error: any) {
    // 401 means token is invalid/expired, clear it
    if (error.response?.status === 401) {
      setAccessToken(null);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    return null;
  }
};

/**
 * Logout: clear localStorage and token only.
 * Backend session is stateless (JWT), no server logout needed.
 */
export const logout = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  setAccessToken(null);
};

/**
 * Get current user from localStorage (client-side cache).
 * For persistent session after refresh, call getMe() on app load.
 */
export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

// Keep registration token helpers for invite flow (local mock); backend can replace later
const mockEncode = (payload: object): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  return btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload));
};

const mockDecode = (token: string): any | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (e) {
    return null;
  }
};

export const generateRegistrationToken = (role: Role, teamId?: string): string => {
  const payload: RegistrationTokenPayload = {
    role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24-hour expiry
  };
  if (teamId) payload.teamId = teamId;
  return mockEncode(payload);
};

export const verifyRegistrationToken = (token: string): RegistrationTokenPayload | null => {
  const payload = mockDecode(token);
  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
};

export const handleRegistration = async (payload: RegistrationTokenPayload, username: string, password: string): Promise<User | null> => {
  try {
    // Call backend registration endpoint
    const response = await api.post('/auth/register', {
      username,
      password,
      role: payload.role,
      teamId: payload.teamId || null,
    });
    const user = response.data;
    toast.success(`User ${username} registered successfully!`);
    return user;
  } catch (error: any) {
    const message = error.response?.data?.detail || 'Registration failed';
    toast.error(message);
    return null;
  }
};
