
import React from 'react';
import { Team, User, Role } from '../types';

interface TeamsProps {
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  currentUser: User | null;
}

const Teams: React.FC<TeamsProps> = ({ teams, currentUser }) => {
  const isAdmin = currentUser?.role === Role.ADMIN;
  return (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {teams.map(team => (
        <div key={team.id} className="bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-lg p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{team.name}</h3>
            <p className="text-sm text-gray-400 mb-4">Owner: {team.owner}</p>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-300">Budget Remaining</p>
              <p className="text-2xl font-bold text-green-400 font-mono">${team.budget.toLocaleString()}</p>
            </div>
             <div className="mb-4">
              <p className="text-sm font-medium text-gray-300">Players Bought</p>
              <p className="text-2xl font-bold text-blue-400">{team.players.length}</p>
            </div>
          </div>
          {isAdmin && (
             <button className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out">
                Edit Team
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Teams;
