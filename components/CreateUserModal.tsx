import React, { useState } from 'react';
import { Role } from '../types';
import { toast } from 'react-hot-toast';
import api from '../core/api';

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.MANAGER);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
        toast.error("Username and password required");
        return;
    }

    setIsLoading(true);
    try {
        await api.post('/auth/register', {
            username,
            password,
            role
        });
        toast.success("User created successfully");
        onSuccess();
        onClose();
    } catch (error: any) {
        toast.error(error.response?.data?.detail || "Failed to create user");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6">Create User</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Role</label>
                    <select
                        value={role}
                        onChange={e => setRole(e.target.value as Role)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value={Role.MANAGER}>Team Manager</option>
                        <option value={Role.ADMIN}>Admin</option>
                        <option value={Role.PLAYER}>Player (User Account)</option>
                    </select>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:bg-gray-600"
                    >
                        {isLoading ? 'Creating...' : 'Create User'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default CreateUserModal;
