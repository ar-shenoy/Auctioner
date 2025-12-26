import React, { useState } from 'react';
import { Player, Team } from '../types';

interface PublicPlayerListProps {
  players: Player[];
  teams: Team[];
}

const PublicPlayerList: React.FC<PublicPlayerListProps> = ({ players, teams }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter players
  const filteredPlayers = players.filter(player => {
    const term = searchTerm.toLowerCase();
    const nameMatch = player.name.toLowerCase().includes(term);
    const phoneMatch = player.phone_number?.includes(term) || false;
    return nameMatch || phoneMatch;
  });

  const getTeamName = (teamId?: string | null) => {
    if (!teamId) return null;
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : null;
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6 text-white font-sans">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h2 className="text-3xl font-bold text-yellow-400 mb-4 md:mb-0">
          All Registered Players <span className="text-gray-400 text-2xl">({players.length})</span>
        </h2>

        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by Name or Phone..."
            className="w-full bg-gray-800 border border-gray-600 rounded-full py-2 px-5 pl-5 pr-12 text-gray-200 focus:outline-none focus:border-yellow-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-4 top-3 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPlayers.map((player, index) => {
            const displayId = `CCL2026-${String(index + 1).padStart(3, '0')}`;
            const teamName = getTeamName(player.team_id);
            const location = player.city || player.state || 'Unknown';
            const displayLocation = teamName || location;

            return (
                <div key={player.id} className="bg-[#1f2937] border border-green-600/50 rounded-xl p-4 flex items-center relative hover:bg-[#2d3748] transition-colors shadow-lg group">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                         <div className="h-16 w-16 rounded-full border-2 border-green-500 overflow-hidden bg-gray-700">
                             {player.profile_photo_url ? (
                                 <img src={player.profile_photo_url} alt={player.name} className="h-full w-full object-cover" />
                             ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-500">
                                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                             )}
                         </div>
                    </div>

                    {/* Info */}
                    <div className="ml-4 flex-1">
                        <h3 className="text-green-400 font-bold text-lg truncate pr-6">{player.name}</h3>
                        <p className="text-red-500 font-mono text-sm font-bold tracking-wide">{displayId}</p>
                        <p className="text-gray-400 text-sm mt-0.5 uppercase tracking-wider font-semibold truncate">
                            {displayLocation}
                        </p>
                    </div>

                    {/* Plus Icon */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 opacity-60 group-hover:opacity-100 transition-opacity">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                </div>
            );
        })}
      </div>

      {filteredPlayers.length === 0 && (
          <div className="text-center text-gray-500 mt-12 text-lg">
              No players found matching "{searchTerm}"
          </div>
      )}
    </div>
  );
};

export default PublicPlayerList;
