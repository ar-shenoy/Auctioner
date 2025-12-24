
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Team, Bid, AuctionStatus, User, Role } from '../types';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'react-hot-toast';
import api from '../core/api';

interface AuctionProps {
  allPlayers: Player[];
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  currentUser: User | null;
  onDataChange?: () => void;
}

const Auction: React.FC<AuctionProps> = ({ allPlayers, teams, setTeams, currentUser, onDataChange }) => {
  const [status, setStatus] = useState<AuctionStatus>(AuctionStatus.NOT_STARTED);
  const [unsoldPlayers, setUnsoldPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [timer, setTimer] = useState(10);
  const [commentary, setCommentary] = useState("The auction is about to begin. Get ready for some excitement!");
  
  // Race condition safety
  const [isBidInFlight, setIsBidInFlight] = useState(false);
  const bidLockRef = useRef<boolean>(false); // Atomic bid lock
  const lastBidTimestampRef = useRef<number>(0); // Track last successful bid time

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

  const startAuction = async () => {
    if (!isAdmin) return;
    if(allPlayers.length === 0) {
        toast.error("No players available to auction.");
        return;
    }
    try {
      // POST /auctions to start
      await api.post('/auctions', { name: `Auction ${new Date().toISOString()}` });
      setStatus(AuctionStatus.IN_PROGRESS);
      setUnsoldPlayers([...allPlayers]);
      setCurrentPlayerIndex(0);
      setCurrentBid(null);
      setBidHistory([]);
      setTimer(10);
      generateCommentary(`The auction starts with ${currentPlayer.name}, a ${currentPlayer.role}.`);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to start auction';
      toast.error(message);
    }
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
    onDataChange?.();
    generateCommentary(`Sold! ${currentPlayer.name} goes to ${currentBid.team.name} for an incredible $${currentBid.amount.toLocaleString()}!`);
  }, [currentBid, currentPlayer, setTeams, unsoldPlayers, generateCommentary, onDataChange]);

  const handleUnsold = useCallback(() => {
    setStatus(AuctionStatus.PLAYER_UNSOLD);
    onDataChange?.();
    generateCommentary(`No bidders for ${currentPlayer.name}. He goes unsold for now.`);
  }, [currentPlayer, generateCommentary, onDataChange]);

  const placeBid = async (team: Team, amount: number) => {
    // ===== ATOMIC BID LOCK =====
    // Only one bid request can be in-flight at a time
    // This prevents race conditions from double-clicking or concurrent requests
    if (bidLockRef.current || isBidInFlight) {
      toast.error('Bid already in flight. Please wait...');
      return;
    }

    // Status validation
    if (status !== AuctionStatus.IN_PROGRESS) {
      return;
    }

    // Permission validation
    if (isManager && currentUser?.teamId !== team.id) {
      toast.error("You can only bid for your own team.");
      return;
    }

    // ===== ACQUIRE BID LOCK =====
    bidLockRef.current = true;
    setIsBidInFlight(true);

    try {
      // ===== SEND BID TO BACKEND (ATOMIC OPERATION) =====
      // Backend is authoritative - it will reject:
      // - Concurrent bids for same player
      // - Invalid amounts
      // - Teams with insufficient budget
      // - Out-of-order auction states
      const response = await api.post(`/auctions/1/bid`, {
        team_id: team.id,
        amount,
        timestamp: new Date().toISOString(), // Include timestamp for backend to detect races
      });

      // ===== BACKEND SUCCESS - UPDATE LOCAL STATE =====
      // Only update UI if backend confirms bid acceptance
      const newBid: Bid = {
        team,
        amount,
        timestamp: new Date(),
      };
      
      setCurrentBid(newBid);
      setBidHistory((prev) => [newBid, ...prev]);
      setTimer(10); // Reset timer on successful bid
      lastBidTimestampRef.current = Date.now();

      generateCommentary(
        `A new bid from ${team.name}! The price for ${currentPlayer.name} is now $${amount.toLocaleString()}!`
      );
    } catch (error: any) {
      // ===== BACKEND REJECTION =====
      // Backend rejects the bid for a reason
      // UI must reflect backend decision, not guess
      const message = error.response?.data?.detail || 'Failed to place bid';
      
      // Different error types
      if (error.response?.status === 409) {
        // Conflict - race condition detected
        // Another bid was placed before this one
        toast.error('Someone placed a bid first. Try again!');
      } else if (error.response?.status === 422) {
        // Validation error - amount invalid, team not found, etc.
        toast.error(message);
      } else if (error.response?.status === 400) {
        // Bad request - auction not in progress, insufficient budget, etc.
        toast.error(message);
      } else {
        // Network error or server error
        toast.error(message);
      }

      console.error('Bid placement error:', {
        status: error.response?.status,
        message: error.response?.data?.detail,
        error: error.message,
      });
    } finally {
      // ===== RELEASE BID LOCK =====
      bidLockRef.current = false;
      setIsBidInFlight(false);
    }
  };
  
  // ===== STATE RESYNC ON MOUNT AND TAB FOCUS =====
  // When page refreshes or user returns to tab, resync auction state from backend
  // This ensures UI reflects true backend state, not stale client state
  useEffect(() => {
    const syncAuctionState = async () => {
      try {
        // Fetch current auction state from backend
        const response = await api.get('/auctions/1');
        const auctionData = response.data;

        // Update local state based on backend truth
        if (auctionData.status) {
          setStatus(auctionData.status as AuctionStatus);
        }
        if (auctionData.current_player_id) {
          // Update current player index based on backend
          const playerIndex = allPlayers.findIndex(p => p.id === auctionData.current_player_id);
          if (playerIndex >= 0) {
            setCurrentPlayerIndex(playerIndex);
          }
        }
        if (auctionData.current_bid) {
          // Resync current highest bid from backend
          const bidTeam = teams.find(t => t.id === auctionData.current_bid.team_id);
          if (bidTeam) {
            setCurrentBid({
              team: bidTeam,
              amount: auctionData.current_bid.amount,
              timestamp: new Date(auctionData.current_bid.timestamp),
            });
          }
        } else {
          setCurrentBid(null);
        }
        if (auctionData.bid_history && Array.isArray(auctionData.bid_history)) {
          // Resync bid history from backend
          const historyBids = auctionData.bid_history.map((bid: any) => {
            const bidTeam = teams.find(t => t.id === bid.team_id);
            return {
              team: bidTeam || { id: bid.team_id, name: 'Unknown Team' } as Team,
              amount: bid.amount,
              timestamp: new Date(bid.timestamp),
            };
          });
          setBidHistory(historyBids);
        }
      } catch (error) {
        // Auction state fetch failed - continue with local state
        console.warn('Could not resync auction state from backend:', error);
      }
    };

    // Sync on mount
    if (status === AuctionStatus.IN_PROGRESS) {
      syncAuctionState();
    }

    // Sync when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden && status === AuctionStatus.IN_PROGRESS) {
        syncAuctionState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, allPlayers, teams]);
  
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
          <p className="text-gray-400 mt-2">{currentPlayer?.role}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-around items-center text-center my-8 p-4 bg-gray-900/50 rounded-lg gap-4 sm:gap-0">
          <div className="w-full sm:w-auto">
            <p className="text-gray-400 text-sm">Base Price</p>
            <p className="text-2xl font-bold text-green-400 font-mono">${currentPlayer?.base_price.toLocaleString()}</p>
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
                    onClick={() => placeBid(team, (currentBid?.amount || currentPlayer.base_price) + 10000)}
                    disabled={
                      status !== AuctionStatus.IN_PROGRESS || 
                      (isManager && currentUser?.teamId !== team.id) ||
                      isBidInFlight
                    }
                    className={`p-4 rounded-lg text-white font-semibold transition-colors ${
                      isBidInFlight
                        ? 'bg-gray-600 cursor-wait text-gray-300'
                        : status !== AuctionStatus.IN_PROGRESS || (isManager && currentUser?.teamId !== team.id)
                        ? 'bg-gray-800 cursor-not-allowed text-gray-500'
                        : 'bg-gray-700 hover:bg-blue-600'
                    }`}
                    title={
                      isBidInFlight
                        ? 'Bid in progress...'
                        : (isManager && currentUser?.teamId !== team.id)
                        ? 'You can only bid for your team'
                        : undefined
                    }
                    >
                    {isBidInFlight && (
                      <span className="inline-block mr-2">⟳</span>
                    )}
                    {team.name}
                    <span className="block text-xs text-gray-400 font-mono">
                      {isBidInFlight ? 'Placing bid...' : `Manager: ${team.manager_id.substring(0, 8)}`}
                    </span>
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
