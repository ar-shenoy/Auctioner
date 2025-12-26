
import React from 'react';
import { Player } from '../types';

interface PlayerStatsModalProps {
  player: Player;
  onClose: () => void;
}

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
    <span className="text-gray-400 font-medium text-sm">{label}</span>
    <span className="text-white font-semibold">{value}</span>
  </div>
);

const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({ player, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-900 to-gray-900 p-6 flex justify-between items-start relative">
                 <div className="flex items-center space-x-6">
                     <div className="h-24 w-24 rounded-full border-4 border-yellow-400 bg-gray-700 overflow-hidden shadow-lg flex-shrink-0">
                        {player.profile_photo_url ? (
                            <img src={player.profile_photo_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-500">{player.name.charAt(0)}</div>
                        )}
                     </div>
                     <div>
                         <h2 className="text-3xl font-bold text-white leading-tight">{player.name}</h2>
                         <div className="flex items-center space-x-2 mt-1">
                             <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">{player.role}</span>
                             {player.is_approved && <span className="text-green-400 text-xs flex items-center">
                                 <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                 Verified
                             </span>}
                         </div>
                         <p className="text-gray-400 text-sm mt-2 flex items-center">
                             <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                             {player.city || 'Unknown City'}, {player.state || 'Unknown State'}
                         </p>
                     </div>
                 </div>
                 <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
            </div>

            <div className="p-8 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                     <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700/50">
                         <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Cricket Profile</h3>
                         <div className="space-y-1">
                             <StatItem label="Batting Style" value={player.batting_style?.replace('_', ' ').toUpperCase() || 'N/A'} />
                             <StatItem label="Bowling Style" value={player.bowling_style?.replace('_', ' ').toUpperCase() || 'N/A'} />
                         </div>
                     </div>
                      <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700/50">
                         <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Auction Info</h3>
                         <div className="space-y-1">
                             <StatItem label="Base Price" value={`₹${(player.base_price/100000).toFixed(1)} Lakhs`} />
                             <StatItem label="Current Status" value={player.status.toUpperCase()} />
                             {player.phone_number && <StatItem label="Phone" value={player.phone_number} />}
                         </div>
                     </div>
                 </div>

                 <div>
                      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Career Statistics (Declared)</h3>
                      <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gray-700/50 p-4 rounded-xl text-center border border-gray-700/50">
                              <p className="text-3xl font-black text-white">{player.matches_played || 0}</p>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-1">Matches</p>
                          </div>
                           <div className="bg-gray-700/50 p-4 rounded-xl text-center border border-gray-700/50">
                              <p className="text-3xl font-black text-white">{player.runs_scored || 0}</p>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-1">Runs</p>
                          </div>
                           <div className="bg-gray-700/50 p-4 rounded-xl text-center border border-gray-700/50">
                              <p className="text-3xl font-black text-white">{player.wickets_taken || 0}</p>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-1">Wickets</p>
                          </div>
                      </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default PlayerStatsModal;
