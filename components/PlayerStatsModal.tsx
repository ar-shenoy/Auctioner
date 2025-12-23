
import React from 'react';
import { Player } from '../types';

interface PlayerStatsModalProps {
  player: Player;
  onClose: () => void;
}

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 px-4 bg-gray-700/50 rounded-lg">
    <span className="text-gray-400 font-medium">{label}</span>
    <span className="text-white font-bold text-lg">{value}</span>
  </div>
);

const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({ player, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-gray-700/50 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">{player.name}</h2>
            <p className="text-gray-400">{player.role} | {player.country}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-blue-400 border-b border-gray-700 pb-2 mb-3">Career Statistics</h3>
            <StatItem label="Matches Played" value={player.stats.matchesPlayed} />
            <StatItem label="Batting Average" value={player.stats.battingAverage.toFixed(2)} />
            <StatItem label="Strike Rate" value={player.stats.strikeRate.toFixed(2)} />
            <StatItem label="Wickets Taken" value={player.stats.wicketsTaken} />
            <StatItem label="Economy Rate" value={player.stats.economyRate.toFixed(2)} />
          </div>
          <div className="space-y-3">
             <h3 className="text-xl font-semibold text-green-400 border-b border-gray-700 pb-2 mb-3">Match History</h3>
             <div className="space-y-2">
                {player.matchHistory.length > 0 ? player.matchHistory.map((perf, index) => (
                    <div key={index} className="bg-gray-700/50 p-3 rounded-lg text-sm">
                        <p>vs Match #{perf.matchId.slice(-4)}</p>
                        <div className="flex justify-between">
                            <span>Runs: <strong>{perf.runsScored} ({perf.ballsFaced})</strong></span>
                            <span>Wickets: <strong>{perf.wicketsTaken}-{perf.runsConceded}</strong></span>
                        </div>
                    </div>
                )) : <p className="text-gray-500 text-center p-4">No match history available.</p>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsModal;
