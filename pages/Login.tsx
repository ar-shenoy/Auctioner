
import React, { useState } from 'react';
import { User } from '../types';
import { login } from '../core/auth';
import { toast } from 'react-hot-toast';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(email, password);
      if (user) {
        toast.success(`Welcome back, ${user.username}!`);
        onLogin(user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 p-4">
      <div className="w-full max-w-md p-4 sm:p-8 space-y-6 sm:space-y-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700/50">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Cricket Ops Platform</h1>
            <p className="mt-2 text-gray-400">Please sign in to continue</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@example.com"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
         <div className="text-center text-xs text-gray-500">
            <p>Sign in with valid credentials from the backend.</p>
         </div>
         <div className="pt-4 border-t border-gray-700">
            <p className="text-center text-sm text-gray-400 mb-3">
              Not an admin? 
            </p>
            <a
              href="?page=player-register"
              className="block w-full text-center px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200"
            >
              Register as a Player
            </a>
         </div>
      </div>
    </div>
  );
};

export default Login;
