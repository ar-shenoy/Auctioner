import React, { useState, useEffect } from 'react';
import { User, Role, Team } from '../types';
import api from '../core/api';
import { toast } from 'react-hot-toast';

interface CreateTeamModalProps {
  onClose: () => void;
  onSuccess: () => void;
  team?: Team;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ onClose, onSuccess, team }) => {
  const [name, setName] = useState(team?.name || '');
  const [description, setDescription] = useState(team?.description || '');
  const [managerId, setManagerId] = useState(team?.manager_id || '');
  const [managers, setManagers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await api.get('/admin/users');
        const allUsers = res.data as User[];
        setManagers(allUsers.filter(u => u.role === Role.MANAGER));
      } catch (e) {
        console.error("Failed to fetch managers");
      }
    };
    fetchManagers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
        toast.error("Team name is required");
        return;
    }

    setIsLoading(true);
    try {
        const payload = {
            name,
            description,
            manager_id: managerId || null
        };

        if (team) {
            await api.put(`/teams/${team.id}`, payload);
            toast.success("Team updated successfully");
        } else {
            await api.post('/teams', payload);
            toast.success("Team created successfully");
        }

        onSuccess();
        onClose();
    } catch (error: any) {
        toast.error(error.response?.data?.detail || "Operation failed");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6">{team ? 'Edit Team' : 'Create New Team'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Team Name *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Assign Manager</label>
                    <select
                        value={managerId}
                        onChange={e => setManagerId(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Select Manager (Optional)</option>
                        {managers.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.username} {m.teamId ? '(Assigned)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:bg-gray-600"
                    >
                        {isLoading ? 'Saving...' : (team ? 'Update Team' : 'Create Team')}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default CreateTeamModal;
