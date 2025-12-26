import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import api from '../core/api';
import CreateUserModal from './CreateUserModal';
import { toast } from 'react-hot-toast';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">User Management</h2>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
            >
                + Create User
            </button>
        </div>

        <div className="overflow-x-auto max-h-96 custom-scrollbar">
            <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-500 uppercase bg-gray-900/50 sticky top-0">
                    <tr>
                        <th className="px-4 py-3">Username</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Team ID</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-700/30">
                            <td className="px-4 py-3 font-medium text-white">{user.username}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    user.role === Role.ADMIN ? 'bg-red-900/30 text-red-400' :
                                    user.role === Role.MANAGER ? 'bg-blue-900/30 text-blue-400' :
                                    'bg-green-900/30 text-green-400'
                                }`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">{user.teamId ? user.teamId.substring(0, 8) : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {isModalOpen && (
            <CreateUserModal
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchUsers}
            />
        )}
    </div>
  );
};

export default UserManagement;
