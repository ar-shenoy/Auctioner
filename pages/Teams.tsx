
import React from 'react';
import { Team, User, Role } from '../types';
import { toast } from 'react-hot-toast';
import api from '../core/api';

interface TeamsProps {
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  currentUser: User | null;
  onDataChange?: () => void;
}

const Teams: React.FC<TeamsProps> = ({ teams, currentUser, onDataChange }) => {
  const isAdmin = currentUser?.role === Role.ADMIN;

  const handleEditTeam = async (team: Team) => {
    const newName = prompt('Edit team name:', team.name);
    if (!newName || newName === team.name) return;

    try {
      await api.put(`/teams/${team.id}`, { name: newName });
      toast.success('Team updated');
      onDataChange?.();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update team';
      toast.error(message);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {teams.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-400 text-lg">No teams created yet</p>
          <p className="text-gray-500 text-sm mt-2">Teams will appear here once created</p>
        </div>
      ) : (
        teams.map(team => (
          <div key={team.id} className="bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-lg p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{team.name}</h3>
              {team.description && <p className="text-sm text-gray-400 mb-4">{team.description}</p>}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-300">Budget Spent</p>
                <p className="text-2xl font-bold text-green-400 font-mono">${team.budget_spent.toLocaleString()}</p>
              </div>
            </div>
            {isAdmin && (
              <button 
                onClick={() => handleEditTeam(team)}
                className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out"
              >
                Edit Team
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Teams;
