
import { User, Role, RegistrationTokenPayload } from '../types';
import { addUser, findUserByUsername } from './db';
import { toast } from 'react-hot-toast';
import { setAccessToken } from './api';

const USER_STORAGE_KEY = 'cricket-ops-user';

export const login = (user: User, token?: string) => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  if (token) setAccessToken(token);
};

export const logout = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  setAccessToken(null);
};

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

export const handleRegistration = (payload: RegistrationTokenPayload, username: string) => {
  if (findUserByUsername(username)) {
    toast.error('Username already exists.');
    return null;
  }

  const newUser: User = {
    id: `u${Date.now()}`,
    username,
    role: payload.role,
    teamId: payload.teamId,
  };

  addUser(newUser);
  toast.success(`User ${username} registered as ${payload.role}!`);
  return newUser;
};
