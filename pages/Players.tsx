
import React, { useState } from 'react';
import { Player, Role, User } from '../types';
import PlayerStatsModal from '../components/PlayerStatsModal';

interface PlayersProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  currentUser: User | null;
}

const Players: React.FC<PlayersProps> = ({ players, currentUser }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const isAdmin = currentUser?.role === Role.ADMIN;

  return (
    <>
      <div className="bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-gray-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3">Player Name</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Batting Avg</th>
                <th scope="col" className="px-6 py-3">Strike Rate</th>
                <th scope="col" className="px-6 py-3">Wickets</th>
                <th scope="col" className="px-6 py-3">Base Price</th>
                {isAdmin && <th scope="col" className="px-6 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player.id} onClick={() => setSelectedPlayer(player)} className="bg-gray-800/80 border-b border-gray-700/50 hover:bg-gray-700/60 cursor-pointer">
                  <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    {player.name}
                    <span className="block text-xs text-gray-500">{player.country}</span>
                  </th>
                  <td className="px-6 py-4">{player.role}</td>
                  <td className="px-6 py-4">{player.stats.battingAverage.toFixed(2)}</td>
                  <td className="px-6 py-4">{player.stats.strikeRate.toFixed(2)}</td>
                  <td className="px-6 py-4">{player.stats.wicketsTaken}</td>
                  <td className="px-6 py-4 font-mono text-green-400">${player.basePrice.toLocaleString()}</td>
                  {isAdmin && (
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <button className="font-medium text-blue-500 hover:underline">Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedPlayer && (
        <PlayerStatsModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </>
  );
};

export default Players;
