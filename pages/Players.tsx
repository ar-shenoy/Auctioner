
import React, { useState } from 'react';
import { Player, Role, User } from '../types';
import PlayerStatsModal from '../components/PlayerStatsModal';
import { toast } from 'react-hot-toast';
import api from '../core/api';

interface PlayersProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  currentUser: User | null;
  onDataChange?: () => void;
}

const Players: React.FC<PlayersProps> = ({ players, currentUser, onDataChange }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const isAdmin = currentUser?.role === Role.ADMIN;

  const handleEditPlayer = async (player: Player) => {
    const newName = prompt('Edit player name:', player.name);
    if (!newName || newName === player.name) return;

    try {
      await api.put(`/players/${player.id}`, { name: newName });
      toast.success('Player updated');
      onDataChange?.();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update player';
      toast.error(message);
    }
  };

  return (
    <>
      <div className="bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-gray-700/50">
        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No players registered yet</p>
            <p className="text-gray-500 text-sm mt-2">Players will appear here once they register</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Player Name</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Base Price</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  {isAdmin && <th scope="col" className="px-6 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id} onClick={() => setSelectedPlayer(player)} className="bg-gray-800/80 border-b border-gray-700/50 hover:bg-gray-700/60 cursor-pointer">
                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                      {player.name}
                    </th>
                    <td className="px-6 py-4">{player.role}</td>
                    <td className="px-6 py-4 font-mono text-green-400">₹{player.base_price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        player.status === 'available' ? 'bg-green-600/30 text-green-400' :
                        player.status === 'sold' ? 'bg-blue-600/30 text-blue-400' :
                        'bg-gray-600/30 text-gray-400'
                      }`}>
                        {player.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleEditPlayer(player)}
                          className="font-medium text-blue-500 hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedPlayer && (
        <PlayerStatsModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </>
  );
};

export default Players;
