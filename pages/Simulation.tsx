
import React, { useState } from 'react';
import { Team, MatchSummary } from '../types';
import { simulateMatch } from '../utils/simulation';
import { toast } from 'react-hot-toast';

interface SimulationProps {
  teams: Team[];
}

const Simulation: React.FC<SimulationProps> = ({ teams }) => {
  const [team1Id, setTeam1Id] = useState<string>('');
  const [team2Id, setTeam2Id] = useState<string>('');
  const [matchResult, setMatchResult] = useState<MatchSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulate = () => {
    if (!team1Id || !team2Id || team1Id === team2Id) {
      toast.error('Please select two different teams.');
      return;
    }
    const team1 = teams.find(t => t.id === team1Id);
    const team2 = teams.find(t => t.id === team2Id);

    if (!team1 || !team2) {
      toast.error('Selected team not found.');
      return;
    }
    
    setIsLoading(true);
    setMatchResult(null);
    setTimeout(() => {
        const result = simulateMatch(team1, team2);
        setMatchResult(result);
        setIsLoading(false);
    }, 1000); // Simulate processing time
  };

  return (
    <div>
      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 mb-8">
        <h2 className="text-2xl font-bold mb-4">Match Setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <select 
            value={team1Id} 
            onChange={e => setTeam1Id(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select Team 1</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <span className="text-center font-bold text-xl text-gray-400 hidden md:inline">VS</span>
          <select 
            value={team2Id} 
            onChange={e => setTeam2Id(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select Team 2</option>
            {teams.filter(t => t.id !== team1Id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <button 
          onClick={handleSimulate}
          disabled={isLoading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg disabled:bg-gray-600 disabled:cursor-wait"
        >
          {isLoading ? 'Simulating...' : 'Simulate Match'}
        </button>
      </div>

      {matchResult && (
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <h2 className="text-3xl font-bold text-center mb-4">Match Result</h2>
          <p className="text-center text-xl font-semibold text-yellow-400 mb-6">{matchResult.winner.name} won the match!</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center mb-8">
            <div className="bg-gray-900/50 p-4 rounded-lg">
                <p className="font-bold text-xl">{matchResult.team1.name}</p>
                <p className="text-3xl font-mono">{matchResult.team1Score}/{matchResult.team1Wickets} ({matchResult.team1Overs})</p>
            </div>
             <div className="bg-gray-900/50 p-4 rounded-lg">
                <p className="font-bold text-xl">{matchResult.team2.name}</p>
                <p className="text-3xl font-mono">{matchResult.team2Score}/{matchResult.team2Wickets} ({matchResult.team2Overs})</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <div className="bg-gray-900/50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-400 mb-2">Top Scorer</h3>
                <p className="font-bold text-lg">{matchResult.topScorer.player.name}</p>
                <p>{matchResult.topScorer.runs} runs ({matchResult.topScorer.balls} balls)</p>
             </div>
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-400 mb-2">Top Bowler</h3>
                <p className="font-bold text-lg">{matchResult.topBowler.player.name}</p>
                <p>{matchResult.topBowler.wickets} wickets for {matchResult.topBowler.runs} runs</p>
             </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Commentary Log</h3>
            <div className="bg-gray-900/50 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                {matchResult.commentary.map((line, i) => (
                    <p key={i} className={`${line.includes('WICKET') ? 'text-red-400' : ''} ${line.includes('End of Innings') ? 'text-yellow-400 font-bold' : ''}`}>{line}</p>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulation;
