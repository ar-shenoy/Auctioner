
import React, { useState } from 'react';
import { Team, Player, User, Role } from '../types';
import { toast } from 'react-hot-toast';
import api from '../core/api';

interface LiveMatchProps {
  teams: Team[];
  onStatUpdate: (playerId: string, performance: { runs?: number, wickets?: number }) => void;
  currentUser: User | null;
}

const LiveMatch: React.FC<LiveMatchProps> = ({ teams, onStatUpdate, currentUser }) => {
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [matchStarted, setMatchStarted] = useState(false);
  
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overs, setOvers] = useState(0);
  const [balls, setBalls] = useState(0);

    const canScore = currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGER;

    const [matchId, setMatchId] = useState<string | null>(null);

    const handleScore = async (runs: number) => {
        if (!canScore) return;
        setScore(s => s + runs);
        handleBall();
        if (!matchId) return;
        try {
            await api.post(`/matches/${matchId}/events`, { event_type: 'run_scored', event_data: JSON.stringify({ runs }) });
        } catch (e) {
            console.error('Failed to send run event', e);
        }
    };
  
    const handleWicket = async () => {
        if (!canScore || wickets >= 10) return;
        setWickets(w => w + 1);
        handleBall();
        if (!matchId) return;
        try {
            await api.post(`/matches/${matchId}/events`, { event_type: 'wicket', event_data: JSON.stringify({}) });
        } catch (e) {
            console.error('Failed to send wicket event', e);
        }
    };

  const handleBall = () => {
    if (balls + 1 === 6) {
        setOvers(o => o + 1);
        setBalls(0);
    } else {
        setBalls(b => b + 1);
    }
  }

  const startMatch = () => {
      const t1 = teams.find(t => t.id === team1?.id);
      const t2 = teams.find(t => t.id === team2?.id);
      if (!t1 || !t2) {
          toast.error("Please select two teams");
          return;
      }
      if (t1.players.length === 0 || t2.players.length === 0) {
          toast.error("Both teams must have players");
          return;
      }
            // Create match on backend
            (async () => {
                try {
                    const body = {
                        name: `${t1.name} vs ${t2.name}`,
                        match_type: 't20',
                        team_1_id: t1.id,
                        team_2_id: t2.id,
                        scheduled_at: new Date().toISOString(),
                    };
                    const resp = await api.post('/matches', body);
                    setMatchId(resp.data.id);
                    setMatchStarted(true);
                } catch (err) {
                    toast.error('Failed to create match on server');
                    console.error(err);
                }
            })();
  }

  if (!matchStarted) {
    return (
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Setup Live Match</h2>
            <div className="space-y-4">
                 <select onChange={e => setTeam1(teams.find(t => t.id === e.target.value) || null)} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600">
                    <option>Select Batting Team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select onChange={e => setTeam2(teams.find(t => t.id === e.target.value) || null)} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600">
                    <option>Select Bowling Team</option>
                    {teams.filter(t => t.id !== team1?.id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
            <button onClick={startMatch} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Start Match</button>
        </div>
    )
  }

  return (
    <div>
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{team1?.name} vs {team2?.name}</h2>
            <p className="text-5xl sm:text-6xl font-mono font-bold my-4">{score} / {wickets}</p>
            <p className="text-xl sm:text-2xl font-mono">Overs: {overs}.{balls}</p>
        </div>
        
        {canScore &&
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                <h3 className="text-xl font-bold mb-4 text-center sm:text-left">Scoring Controls</h3>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {[0, 1, 2, 3, 4, 6].map(runs => (
                        <button key={runs} onClick={() => handleScore(runs)} className="p-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">{runs} Runs</button>
                    ))}
                    <button onClick={handleWicket} className="p-4 bg-red-600 text-white font-bold rounded-lg col-span-3 hover:bg-red-700">WICKET</button>
                </div>
            </div>
        }
    </div>
  );
};

export default LiveMatch;
