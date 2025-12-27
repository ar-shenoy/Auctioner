
import React, { useState } from 'react';
import { Team, User, Role, Player } from '../types';
import CreateTeamModal from '../components/CreateTeamModal';

interface TeamsProps {
  teams: Team[];
  players: Player[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  currentUser: User | null;
  onDataChange?: () => void;
}

const Teams: React.FC<TeamsProps> = ({ teams, players, currentUser, onDataChange }) => {
  const isAdmin = currentUser?.role === Role.ADMIN;
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleCreateClick = () => {
      setEditingTeam(null);
      setIsModalOpen(true);
  };

  const handleEditClick = (team: Team, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingTeam(team);
      setIsModalOpen(true);
  };

  const handleSuccess = () => {
      if (onDataChange) onDataChange();
  };

  const getTeamSquad = (teamId: string) => {
      return players.filter(p => p.team_id === teamId);
  };

  return (
    <>
        {isAdmin && (
            <div className="flex justify-end mb-6">
                <button
                    onClick={handleCreateClick}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Create Team
                </button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {teams.length === 0 ? (
            <div className="col-span-full text-center py-12">
            <p className="text-gray-400 text-lg">No teams created yet</p>
            <p className="text-gray-500 text-sm mt-2">Teams will appear here once created</p>
            </div>
        ) : (
            teams.map(team => {
                const squad = getTeamSquad(team.id);
                const squadSize = squad.length;

                return (
                <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className="bg-gray-800 rounded-xl border border-gray-700 hover:border-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300 cursor-pointer group overflow-hidden relative"
                >
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                                {team.name.charAt(0)}
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={(e) => handleEditClick(team, e)}
                                    className="text-gray-500 hover:text-white p-1 hover:bg-gray-700 rounded transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors truncate pr-2">{team.name}</h3>
                        <p className="text-xs text-gray-500 font-mono mb-6 uppercase tracking-wider">Manager: {team.manager_id ? team.manager_id.substring(0, 8) : 'Unassigned'}</p>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">Squad Size</span>
                                    <span className="text-white font-medium">{squadSize} / 25</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(squadSize / 25) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">Budget Used</span>
                                    <span className="text-green-400 font-mono">₹{((team.budget_spent || 0)/10000000).toFixed(2)}Cr</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${((team.budget_spent || 0) / 1000000000) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )})
        )}
        </div>

        {/* Squad Modal */}
        {selectedTeam && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTeam(null)}>
                <div className="bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="p-4 sm:p-6 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white">{selectedTeam.name}</h2>
                            <p className="text-gray-400 text-sm mt-1">Full Squad & Analysis</p>
                        </div>
                        <button onClick={() => setSelectedTeam(null)} className="text-gray-500 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-900/50">
                        {getTeamSquad(selectedTeam.id).length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-500 text-lg">No players purchased yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getTeamSquad(selectedTeam.id).map(player => (
                                    <div key={player.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center space-x-4">
                                         <div className="h-12 w-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                            {player.profile_photo_url ? (
                                                <img src={player.profile_photo_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">{player.name[0]}</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{player.name}</p>
                                            <p className="text-xs text-gray-400 uppercase">{player.role}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-green-400 font-mono font-bold text-sm">₹{(player.sold_price!/100000).toFixed(1)}L</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 sm:p-6 border-t border-gray-800 bg-gray-900">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                             <div className="bg-gray-800 p-3 rounded-lg">
                                 <p className="text-xs text-gray-500 uppercase font-bold">Total Spent</p>
                                 <p className="text-green-400 font-mono text-xl">₹{((selectedTeam.budget_spent || 0)/10000000).toFixed(2)}Cr</p>
                             </div>
                             <div className="bg-gray-800 p-3 rounded-lg">
                                 <p className="text-xs text-gray-500 uppercase font-bold">Remaining</p>
                                 <p className="text-blue-400 font-mono text-xl">₹{((1000000000 - (selectedTeam.budget_spent || 0))/10000000).toFixed(2)}Cr</p>
                             </div>
                              <div className="bg-gray-800 p-3 rounded-lg">
                                 <p className="text-xs text-gray-500 uppercase font-bold">Squad Size</p>
                                 <p className="text-white font-mono text-xl">{getTeamSquad(selectedTeam.id).length}</p>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {isModalOpen && (
            <CreateTeamModal
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                team={editingTeam || undefined}
            />
        )}
    </>
  );
};

export default Teams;
