
import React, { useState } from 'react';
import { Player, Team } from '../types';
import StatCard from '../components/StatCard';
import PlayerIcon from '../components/icons/PlayerIcon';
import TeamIcon from '../components/icons/TeamIcon';
import api from '../core/api';
import { toast } from 'react-hot-toast';
import UserManagement from '../components/UserManagement';

interface DashboardProps {
  players: Player[];
  teams: Team[];
  onDataChange?: () => void;
}

const AdminDashboard: React.FC<DashboardProps> = ({ players, teams, onDataChange }) => {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const totalBudgetSpent = teams.reduce((acc, team) => acc + team.budget_spent, 0);
    const totalPlayers = players.length;
    const playersPerTeam = teams.length > 0 ? (totalPlayers / teams.length) : 0;

    const pendingPlayers = players.filter(p => p.is_approved === false);

    const handleApprove = async (id: string) => {
        try {
            await api.patch(`/players/${id}/approve`);
            toast.success('Player Approved');
            if (onDataChange) onDataChange();
        } catch (error) {
            toast.error('Failed to approve');
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm('Are you sure you want to reject (delete) this player?')) return;
        try {
            await api.delete(`/players/${id}`);
            toast.success('Player Rejected');
            if (onDataChange) onDataChange();
        } catch (error) {
            toast.error('Failed to reject');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-end">
                <button
                    onClick={() => setIsUserModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    Manage Users
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Players" value={totalPlayers} icon={<PlayerIcon className="h-8 w-8" />} />
                <StatCard title="Total Teams" value={teams.length} icon={<TeamIcon className="h-8 w-8" />} />
                <StatCard title="Pending Approvals" value={pendingPlayers.length} icon={
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                } color="text-yellow-400" />
                 <StatCard title="Avg Players/Team" value={playersPerTeam.toFixed(1)} icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                }/>
            </div>

            {/* Pending Approvals Section */}
            {pendingPlayers.length > 0 && (
                <div className="bg-[#2a0a55]/20 border border-yellow-500/30 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                        <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded mr-3">ACTION NEEDED</span>
                        Pending Player Approvals ({pendingPlayers.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-gray-800 text-gray-200 uppercase font-medium">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Base Price</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {pendingPlayers.map(player => (
                                    <tr key={player.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-white">{player.name}</td>
                                        <td className="px-4 py-3">{player.role}</td>
                                        <td className="px-4 py-3">₹{(player.base_price || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3">{player.phone_number}</td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button
                                                onClick={() => handleApprove(player.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                                            >
                                                APPROVE
                                            </button>
                                            <button
                                                onClick={() => handleReject(player.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                                            >
                                                REJECT
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-white">Recent Registrations</h2>
                    {players.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No players registered yet</p>
                    ) : (
                        <ul className="space-y-3">
                            {players.slice(0, 5).map(player => (
                                <li key={player.id} className="flex justify-between items-center bg-gray-700/30 p-3 rounded-md border border-gray-700/50">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-600 overflow-hidden">
                                            {player.profile_photo_url ? (
                                                <img src={player.profile_photo_url} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">IMG</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{player.name}</p>
                                            <p className="text-xs text-gray-400 uppercase">{player.role} • {player.is_approved ? <span className="text-green-400">Approved</span> : <span className="text-yellow-500">Pending</span>}</p>
                                        </div>
                                    </div>
                                    <span className="font-mono text-green-400 font-bold">₹{((player.base_price || 0)/100000).toFixed(1)}L</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-white">Team Budgets</h2>
                    {teams.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No teams created yet</p>
                    ) : (
                        <ul className="space-y-4">
                            {teams.slice(0, 5).map(team => (
                                <li key={team.id}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-base font-medium text-white">{team.name}</span>
                                        <span className="text-sm font-medium text-gray-400">₹{team.budget_spent.toLocaleString()} / 100Cr</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full" style={{ width: `${(team.budget_spent / 1000000000) * 100}%` }}></div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {isUserModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setIsUserModalOpen(false)}>
                    <div className="w-full max-w-4xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsUserModalOpen(false)} className="absolute -top-10 right-0 text-gray-400 hover:text-white text-xl">✕ Close</button>
                        <UserManagement />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
