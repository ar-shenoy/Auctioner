
import React from 'react';
import { Player, Team } from '../types';
import StatCard from '../components/StatCard';
import PlayerIcon from '../components/icons/PlayerIcon';
import TeamIcon from '../components/icons/TeamIcon';

interface DashboardProps {
  players: Player[];
  teams: Team[];
}

const AdminDashboard: React.FC<DashboardProps> = ({ players, teams }) => {
    const totalBudgetSpent = teams.reduce((acc, team) => acc + team.budget_spent, 0);
    const totalPlayers = players.length;
    const playersPerTeam = teams.length > 0 ? (totalPlayers / teams.length) : 0;

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Players" value={totalPlayers} icon={<PlayerIcon className="h-8 w-8" />} />
                <StatCard title="Total Teams" value={teams.length} icon={<TeamIcon className="h-8 w-8" />} />
                <StatCard title="Total Budget Spent" value={`₹${(totalBudgetSpent / 1000000).toFixed(2)}M`} icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
                    </svg>
                }/>
                 <StatCard title="Players per Team" value={playersPerTeam.toFixed(1)} icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                }/>
            </div>

             <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                    <h2 className="text-xl font-semibold mb-4">Recent Players</h2>
                    {players.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No players registered yet</p>
                    ) : (
                        <ul className="space-y-3">
                            {players.slice(0, 5).map(player => (
                                <li key={player.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md">
                                    <div>
                                        <p className="font-semibold">{player.name}</p>
                                        <p className="text-sm text-gray-400">{player.role}</p>
                                    </div>
                                    <span className="font-mono text-green-400">₹{player.base_price.toLocaleString()}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                    <h2 className="text-xl font-semibold mb-4">Team Budget Status</h2>
                    {teams.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No teams created yet</p>
                    ) : (
                        <ul className="space-y-4">
                            {teams.slice(0, 5).map(team => (
                                <li key={team.id}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-base font-medium text-white">{team.name}</span>
                                        <span className="text-sm font-medium text-gray-400">₹{team.budget_spent.toLocaleString()} spent</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(team.budget_spent / 2000000) * 100}%` }}></div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
