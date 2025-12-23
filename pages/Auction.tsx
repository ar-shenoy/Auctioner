
import React, { useState, useEffect, useCallback } from 'react';
import { Player, Team, Bid, AuctionStatus, User, Role } from '../types';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'react-hot-toast';

interface AuctionProps {
  allPlayers: Player[];
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  currentUser: User | null;
}

const Auction: React.FC<AuctionProps> = ({ allPlayers, teams, setTeams, currentUser }) => {
  const [status, setStatus] = useState<AuctionStatus>(AuctionStatus.NOT_STARTED);
  const [unsoldPlayers, setUnsoldPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [timer, setTimer] = useState(10);
  const [commentary, setCommentary] = useState("The auction is about to begin. Get ready for some excitement!");

  const isAdmin = currentUser?.role === Role.ADMIN;
  const isManager = currentUser?.role === Role.MANAGER;

  const currentPlayer = allPlayers[currentPlayerIndex];

  const generateCommentary = useCallback(async (context: string) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const prompt = `You are a cricket auction commentator. Provide a short, exciting, one-sentence commentary for the following situation: ${context}`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        setCommentary(response.text);
    } catch (error) {
        console.error("Commentary generation failed:", error);
        setCommentary("The atmosphere is electric!");
    }
  }, []);

  const startAuction = () => {
    if (!isAdmin) return;
    if(allPlayers.length === 0) {
        toast.error("No players available to auction.");
        return;
    }
    setStatus(AuctionStatus.IN_PROGRESS);
    setUnsoldPlayers([...allPlayers]);
    setCurrentPlayerIndex(0);
    setCurrentBid(null);
    setBidHistory([]);
    setTimer(10);
    generateCommentary(`The auction starts with ${currentPlayer.name}, a talented ${currentPlayer.role} from ${currentPlayer.country}.`);
  };

  const nextPlayer = () => {
    if (currentPlayerIndex + 1 >= allPlayers.length) {
      setStatus(AuctionStatus.FINISHED);
      generateCommentary("And that's a wrap! The auction has concluded. What a fantastic event!");
      return;
    }
    const nextIndex = currentPlayerIndex + 1;
    setCurrentPlayerIndex(nextIndex);
    setCurrentBid(null);
    setBidHistory([]);
    setTimer(10);
    setStatus(AuctionStatus.IN_PROGRESS);
    generateCommentary(`${allPlayers[nextIndex].name} is next on the block! A promising ${allPlayers[nextIndex].role}.`);
  };

  const handleSold = useCallback(() => {
    if (!currentBid) return;
    setStatus(AuctionStatus.PLAYER_SOLD);
    
    setTeams(currentTeams => {
        const winningTeam = currentTeams.find(t => t.id === currentBid.team.id);
        if (winningTeam) {
          return currentTeams.map(t =>
            t.id === winningTeam.id
              ? {
                  ...t,
                  budget: t.budget - currentBid.amount,
                  players: [...t.players, currentPlayer],
                }
              : t
          );
        }
        return currentTeams;
    });

    setUnsoldPlayers(unsoldPlayers.filter(p => p.id !== currentPlayer.id));
    generateCommentary(`Sold! ${currentPlayer.name} goes to ${currentBid.team.name} for an incredible $${currentBid.amount.toLocaleString()}!`);
  }, [currentBid, currentPlayer, setTeams, unsoldPlayers, generateCommentary]);

  const handleUnsold = useCallback(() => {
    setStatus(AuctionStatus.PLAYER_UNSOLD);
    generateCommentary(`No bidders for ${currentPlayer.name}. He goes unsold for now.`);
  }, [currentPlayer, generateCommentary]);

  const placeBid = (team: Team, amount: number) => {
    if (status !== AuctionStatus.IN_PROGRESS) return;
    if (isManager && currentUser?.teamId !== team.id) {
        toast.error("You can only bid for your own team.");
        return;
    }
    if (amount > team.budget) {
      toast.error(`${team.name} does not have enough budget.`);
      return;
    }
    const newBid: Bid = { team, amount, timestamp: new Date() };
    setCurrentBid(newBid);
    setBidHistory(prev => [newBid, ...prev]);
    setTimer(10); // Reset timer
    generateCommentary(`A new bid from ${team.name}! The price for ${currentPlayer.name} is now $${amount.toLocaleString()}!`);
  };
  
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (status === AuctionStatus.IN_PROGRESS && timer > 0) {
      intervalId = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (status === AuctionStatus.IN_PROGRESS && timer === 0) {
      if (currentBid) {
        handleSold();
      } else {
        handleUnsold();
      }
    }
    return () => clearInterval(intervalId);
  }, [status, timer, currentBid, handleSold, handleUnsold]);


  if (status === AuctionStatus.NOT_STARTED) {
    return (
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4">Auction Not Started</h2>
        {isAdmin && <button onClick={startAuction} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-xl">Start Auction</button>}
      </div>
    );
  }

  if (status === AuctionStatus.FINISHED) {
    return <div className="text-center"><h2 className="text-4xl font-bold mb-4">Auction Finished!</h2></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
        <div className="text-center mb-6">
          <p className="text-lg font-medium text-blue-400">Up for Auction</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white">{currentPlayer?.name}</h2>
          <p className="text-gray-400 mt-2">{currentPlayer?.role} | {currentPlayer?.country} | Age: {currentPlayer?.age}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-around items-center text-center my-8 p-4 bg-gray-900/50 rounded-lg gap-4 sm:gap-0">
          <div className="w-full sm:w-auto">
            <p className="text-gray-400 text-sm">Base Price</p>
            <p className="text-2xl font-bold text-green-400 font-mono">${currentPlayer?.basePrice.toLocaleString()}</p>
          </div>
          <div className="border-b-2 sm:border-l-2 border-gray-700 h-auto sm:h-16 w-full sm:w-auto"></div>
           <div className="w-full sm:w-auto">
            <p className="text-gray-400 text-sm">Timer</p>
            <p className={`text-5xl font-bold font-mono ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>{timer}s</p>
          </div>
           <div className="border-b-2 sm:border-l-2 border-gray-700 h-auto sm:h-16 w-full sm:w-auto"></div>
          <div className="w-full sm:w-auto">
            <p className="text-gray-400 text-sm">Current Bid</p>
            <p className="text-2xl font-bold text-green-400 font-mono">${currentBid?.amount.toLocaleString() || '---'}</p>
            <p className="text-xs text-gray-500">{currentBid?.team.name || 'No bids yet'}</p>
          </div>
        </div>
        
        <div className='my-4 p-4 bg-gray-900/50 rounded-lg text-center'>
            <p className='text-lg italic text-cyan-300'>"{commentary}"</p>
        </div>
        
        { (isAdmin || isManager) && 
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {teams.map(team => (
                    <button
                    key={team.id}
                    onClick={() => placeBid(team, (currentBid?.amount || currentPlayer.basePrice) + 10000)}
                    disabled={status !== AuctionStatus.IN_PROGRESS || (isManager && currentUser?.teamId !== team.id) || team.budget < (currentBid?.amount || currentPlayer.basePrice) + 10000}
                    className="p-4 bg-gray-700 rounded-lg text-white font-semibold hover:bg-blue-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500 transition-colors"
                    >
                    {team.name}
                    <span className="block text-xs text-gray-400 font-mono">${team.budget.toLocaleString()}</span>
                    </button>
                ))}
            </div>
        }
      </div>

      <div>
        {isAdmin && (
          <div className="bg-gray-800/50 p-6 rounded-xl mb-6 border border-gray-700/50">
            <h3 className="text-xl font-bold mb-4">Admin Controls</h3>
            <div className="flex space-x-2">
              <button onClick={handleSold} disabled={!currentBid} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded">Mark Sold</button>
              <button onClick={handleUnsold} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">Mark Unsold</button>
            </div>
             <button onClick={nextPlayer} disabled={status === AuctionStatus.IN_PROGRESS} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded">Next Player</button>
          </div>
        )}

        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <h3 className="text-xl font-bold mb-4">Bid History</h3>
          <ul className="space-y-2 h-96 overflow-y-auto">
            {bidHistory.map((bid, index) => (
              <li key={index} className="flex justify-between p-2 bg-gray-700/50 rounded">
                <span className="font-semibold">{bid.team.name}</span>
                <span className="font-mono text-green-300">${bid.amount.toLocaleString()}</span>
              </li>
            ))}
             {bidHistory.length === 0 && <p className='text-gray-500 text-center mt-8'>No bids placed yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Auction;
