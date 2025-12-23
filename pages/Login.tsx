
import React, { useState } from 'react';
import { User } from '../types';
import { findUserByUsername } from '../core/db';
import { toast } from 'react-hot-toast';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = findUserByUsername(username);
    if (user) {
      // In a real app, you would verify the password hash
      toast.success(`Welcome back, ${user.username}!`);
      onLogin(user);
    } else {
      toast.error('Invalid username or password.');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700/50">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Cricket Ops Platform</h1>
            <p className="mt-2 text-gray-400">Please sign in to continue</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-400">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any password will work"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
            >
              Sign In
            </button>
          </div>
        </form>
         <div className="text-center text-xs text-gray-500">
            <p>Use 'admin', 'manager', or 'player' as username.</p>
            <p>Registration is by invite link only.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
