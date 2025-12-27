
import React, { useState } from 'react';
import { Player, Role, User } from '../types';
import PlayerStatsModal from '../components/PlayerStatsModal';
import PlayerFormModal from '../components/PlayerFormModal';
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
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const isAdmin = currentUser?.role === Role.ADMIN;

  const handleEditClick = (player: Player, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingPlayer(player);
      setIsFormOpen(true);
  };

  const handleAddClick = () => {
      setEditingPlayer(null);
      setIsFormOpen(true);
  };

  const handleSuccess = () => {
      if (onDataChange) onDataChange();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Players Directory</h2>
          {isAdmin && (
              <button
                onClick={handleAddClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors flex items-center"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Player
              </button>
          )}
      </div>

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
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Player Name</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Role</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Base Price</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Status</th>
                  {isAdmin && <th scope="col" className="px-4 py-3 whitespace-nowrap">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id} onClick={() => setSelectedPlayer(player)} className="bg-gray-800/80 border-b border-gray-700/50 hover:bg-gray-700/60 cursor-pointer">
                    <th scope="row" className="px-4 py-3 font-medium text-white whitespace-nowrap flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-600 mr-2 overflow-hidden">
                          {player.profile_photo_url ? <img src={player.profile_photo_url} className="h-full w-full object-cover" /> : null}
                      </div>
                      {player.name}
                    </th>
                    <td className="px-4 py-3 whitespace-nowrap">{player.role}</td>
                    <td className="px-4 py-3 font-mono text-green-400 whitespace-nowrap">₹{(player.base_price || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        player.status === 'available' ? 'bg-green-600/30 text-green-400' :
                        player.status === 'sold' ? 'bg-blue-600/30 text-blue-400' :
                        'bg-gray-600/30 text-gray-400'
                      }`}>
                        {player.status.toUpperCase()}
                      </span>
                      {!player.is_approved && <span className="ml-2 text-yellow-500 text-xs border border-yellow-500 px-1 rounded">PENDING</span>}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => handleEditClick(player, e)}
                          className="font-medium text-blue-500 hover:text-blue-400 hover:underline"
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

      {isFormOpen && (
          <PlayerFormModal
            player={editingPlayer || undefined}
            onClose={() => setIsFormOpen(false)}
            onSuccess={handleSuccess}
          />
      )}
    </>
  );
};

export default Players;
