
import React, { useState, useEffect } from 'react';
import { RegistrationTokenPayload, Role } from '../types';
import { verifyRegistrationToken, handleRegistration } from '../core/auth';
import { toast } from 'react-hot-toast';

interface RegisterProps {
  token: string;
}

const Register: React.FC<RegisterProps> = ({ token }) => {
  const [payload, setPayload] = useState<RegistrationTokenPayload | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    const verifiedPayload = verifyRegistrationToken(token);
    if (verifiedPayload) {
      setPayload(verifiedPayload);
      setIsValidToken(true);
    } else {
      setIsValidToken(false);
      toast.error("Invalid or expired registration link.");
    }
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payload) return;
    const newUser = handleRegistration(payload, username);
    if (newUser) {
        // In a real app, you would redirect to login
        setTimeout(() => window.location.href = window.location.origin, 2000);
    }
  };

  if (isValidToken === null) {
      return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Verifying link...</div>
  }
  
  if (!isValidToken || !payload) {
      return <div className="flex items-center justify-center h-screen bg-gray-900 text-red-500">This registration link is invalid or has expired.</div>
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700/50">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Create Your Account</h1>
            <p className="mt-2 text-blue-400">You are registering as a: <strong>{payload.role}</strong></p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-400">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Complete Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
