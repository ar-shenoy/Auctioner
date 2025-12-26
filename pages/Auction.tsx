
import React, { useState, useEffect, useRef } from 'react';
import { Player, Team, Bid, AuctionStatus, User, Role } from '../types';
import { toast } from 'react-hot-toast';
import api from '../core/api';

interface AuctionProps {
  allPlayers: Player[];
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  currentUser: User | null;
  onDataChange?: () => void;
}

const Auction: React.FC<AuctionProps> = ({ allPlayers, teams, currentUser, onDataChange }) => {
  const [status, setStatus] = useState<AuctionStatus>(AuctionStatus.NOT_STARTED);
  const [auctionId, setAuctionId] = useState<string | null>(null);

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [timer, setTimer] = useState(10);
  
  const [isBidInFlight, setIsBidInFlight] = useState(false);
  const bidLockRef = useRef<boolean>(false);

  const isAdmin = currentUser?.role === Role.ADMIN;
  const isManager = currentUser?.role === Role.MANAGER;

  // Sync with backend state
  const syncAuctionState = async (forceId?: string) => {
      try {
        const idToFetch = forceId || auctionId;
        if (!idToFetch) return;

        const response = await api.get(`/auctions/${idToFetch}`);
        const auctionData = response.data;

        setAuctionId(auctionData.id);
        setStatus(auctionData.status as AuctionStatus);

        // Sync Player
        if (auctionData.current_player_id) {
            const player = allPlayers.find(p => p.id === auctionData.current_player_id);
            if (player) setCurrentPlayer(player);
        } else {
            setCurrentPlayer(null);
        }

        // Sync Bid
        if (auctionData.current_bid) {
            const bidTeam = teams.find(t => t.id === auctionData.current_bidder_id); // Backend returns bidder_id
            if (bidTeam) {
                setCurrentBid({
                    team: bidTeam,
                    amount: auctionData.current_bid,
                    timestamp: new Date(), // Backend doesn't send bid timestamp in summary
                });
            }
        } else {
            setCurrentBid(null);
        }

        // We can't easily sync timer from backend without websocket time-sync, so we rely on local timer reset on events
      } catch (e) {
          console.error("Sync failed", e);
      }
  };

  // Initial Load - Find active auction
  useEffect(() => {
      const init = async () => {
          try {
              const res = await api.get('/auctions');
              const active = res.data.find((a: any) => a.status === 'ongoing' || a.status === 'paused');
              if (active) {
                  setAuctionId(active.id);
                  syncAuctionState(active.id);
              } else {
                  // Check if any scheduled
                   const scheduled = res.data.find((a: any) => a.status === 'scheduled');
                   if (scheduled) {
                       setAuctionId(scheduled.id);
                       setStatus(AuctionStatus.NOT_STARTED); // waiting to start
                   }
              }
          } catch (e) {}
      };
      init();
  }, []);

  // Polling for updates (since we don't have websockets fully wired in frontend yet)
  useEffect(() => {
      if (!auctionId || status === AuctionStatus.NOT_STARTED) return;
      const interval = setInterval(() => syncAuctionState(), 2000);
      return () => clearInterval(interval);
  }, [auctionId, status]);

  const startAuction = async () => {
    if (!isAdmin) return;
    try {
      // Find eligible players
      const eligible = allPlayers.filter(p => p.status === 'available' && p.is_approved);
      if(eligible.length === 0) {
        toast.error("No eligible players available.");
        return;
      }

      // 1. Check/Create Auction
      let aid = auctionId;
      if (!aid) {
          const res = await api.post('/auctions', {
              name: `Auction ${new Date().toLocaleDateString()}`,
              current_player_id: eligible[0].id
          });
          aid = res.data.id;
          setAuctionId(aid);
      }

      // 2. Start
      await api.post(`/auctions/${aid}/start`);
      setStatus(AuctionStatus.IN_PROGRESS);
      syncAuctionState(aid);
      toast.success("Auction Started!");

    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to start');
    }
  };

  const nextPlayer = async () => {
      if (!auctionId || !isAdmin) return;

      // Find next available player
      // We look at allPlayers, find current index, look ahead
      const eligible = allPlayers.filter(p => p.status === 'available' && p.is_approved);
      // Note: currentPlayer might be SOLD now (after refresh), so we just pick first AVAILABLE
      
      if (eligible.length === 0) {
          toast.success("No more players!");
          return;
      }

      const nextP = eligible[0]; // Simple queue: top of available list

      try {
          await api.put(`/auctions/${auctionId}/player`, { player_id: nextP.id });
          setTimer(10);
          setBidHistory([]);
          syncAuctionState();
      } catch (e) {
          toast.error("Failed to switch player");
      }
  };

  const handleSold = async () => {
    if (!auctionId || !isAdmin) return;
    try {
        await api.post(`/auctions/${auctionId}/sold`);
        toast.success("Sold!");
        onDataChange?.(); // Refresh global data (players/teams)
        setTimer(10);
        // Auto-advance? Maybe let admin click Next
    } catch (e) {
        toast.error("Failed to mark sold");
    }
  };

  const handleUnsold = async () => {
    if (!auctionId || !isAdmin) return;
    try {
        await api.post(`/auctions/${auctionId}/unsold`);
        toast.success("Unsold");
        onDataChange?.();
        setTimer(10);
    } catch (e) {
        toast.error("Failed");
    }
  };

  const placeBid = async (team: Team, amount: number) => {
      if (bidLockRef.current || isBidInFlight || !auctionId) return;

      bidLockRef.current = true;
      setIsBidInFlight(true);

      try {
          await api.post(`/auctions/${auctionId}/bid`, {
              team_id: team.id,
              amount: amount,
          });
          setTimer(10); // Reset timer on bid
          // Optimistic update or wait for poll? Poll is 2s, might be slow.
          // Manually update local state for feedback
          setCurrentBid({ team, amount, timestamp: new Date() });
          setBidHistory(prev => [{ team, amount, timestamp: new Date() }, ...prev]);
      } catch (error: any) {
          toast.error(error.response?.data?.detail || "Bid failed");
      } finally {
          bidLockRef.current = false;
          setIsBidInFlight(false);
      }
  };

  // Timer Logic
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (status === AuctionStatus.IN_PROGRESS && timer > 0) {
      intervalId = setInterval(() => setTimer(t => t - 1), 1000);
    }
    // Auto-sell logic on timer end?
    // In a real app, Admin should confirm. Or auto-sell if bid exists.
    // Let's leave it manual for safety.
    return () => clearInterval(intervalId);
  }, [status, timer]);

  if (status === AuctionStatus.NOT_STARTED) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <h2 className="text-4xl font-bold text-gray-400">Auction Floor Closed</h2>
        {isAdmin && (
            <button
                onClick={startAuction}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-12 rounded-full shadow-lg transform transition hover:scale-105 text-xl"
            >
                OPEN AUCTION FLOOR
            </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-100px)] h-auto">
      {/* Main Auction Stage (Left/Center) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Player Card */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8 border border-gray-700 shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-center items-center text-center min-h-[500px] sm:min-h-0">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none"></div>

              {currentPlayer ? (
                  <>
                    <div className="relative mb-6">
                        <div className="w-40 h-40 rounded-full border-4 border-yellow-400 p-1 bg-gray-900 mx-auto shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                            <div className="w-full h-full rounded-full bg-gray-700 overflow-hidden">
                                {currentPlayer.profile_photo_url ? (
                                    <img src={currentPlayer.profile_photo_url} className="w-full h-full object-cover" alt={currentPlayer.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500 font-bold">
                                        {currentPlayer.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black font-bold px-4 py-1 rounded-full text-sm uppercase tracking-wider">
                            {currentPlayer.role}
                        </div>
                    </div>

                    <h2 className="text-3xl sm:text-5xl font-black text-white mb-2 tracking-tight">{currentPlayer.name}</h2>
                    <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8">{currentPlayer.city || 'Unknown Location'}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 w-full max-w-2xl bg-gray-900/50 p-4 sm:p-6 rounded-xl border border-gray-700/50">
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Base Price</p>
                            <p className="text-2xl font-mono text-white">₹{(currentPlayer.base_price/100000).toFixed(1)}L</p>
                        </div>
                        <div className="border-x-0 sm:border-x border-t sm:border-t-0 border-b sm:border-b-0 border-gray-700 py-4 sm:py-0 my-4 sm:my-0">
                            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Current Bid</p>
                            <p className={`text-3xl font-mono font-bold ${currentBid ? 'text-green-400' : 'text-gray-600'}`}>
                                {currentBid ? `₹${(currentBid.amount/100000).toFixed(1)}L` : '---'}
                            </p>
                        </div>
                         <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Timer</p>
                            <p className={`text-3xl font-mono font-bold ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                                {timer}s
                            </p>
                        </div>
                    </div>
                  </>
              ) : (
                  <div className="text-gray-500">
                      <p className="text-2xl">No Player Selected</p>
                      {isAdmin && <button onClick={nextPlayer} className="mt-4 text-blue-400 hover:underline">Select Next Player</button>}
                  </div>
              )}
          </div>

          {/* Bidding Controls (Managers/Admin) */}
          {(isAdmin || isManager) && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-gray-400 text-sm font-bold uppercase mb-4 tracking-wider">Place Bid</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {teams.map(team => {
                          const canBid = isAdmin || (isManager && currentUser?.teamId === team.id);
                          const nextBidAmount = (currentBid?.amount || (currentPlayer?.base_price || 0)) + 100000; // 1L increment

                          return (
                            <button
                                key={team.id}
                                disabled={!canBid || !currentPlayer || isBidInFlight}
                                onClick={() => placeBid(team, nextBidAmount)}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${
                                    canBid
                                        ? 'bg-gray-700 border-gray-600 hover:bg-indigo-600 hover:border-indigo-500 hover:shadow-lg text-white'
                                        : 'bg-gray-800 border-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                                }`}
                            >
                                <span className="font-bold text-sm truncate w-full text-center">{team.name}</span>
                                {canBid && <span className="text-xs font-mono mt-1 text-green-300">+ ₹1L</span>}
                            </button>
                          );
                      })}
                  </div>
              </div>
          )}
      </div>

      {/* Sidebar (Right) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Admin Actions */}
          {isAdmin && (
              <div className="bg-gray-800 p-6 rounded-xl border border-yellow-500/30 shadow-lg">
                  <h3 className="text-yellow-500 text-xs font-bold uppercase mb-4 tracking-wider">Auctioneer Controls</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                      <button
                        onClick={handleSold}
                        disabled={!currentBid}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-lg shadow-lg transition"
                      >
                          SOLD
                      </button>
                      <button
                        onClick={handleUnsold}
                        disabled={!!currentBid}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-lg shadow-lg transition"
                      >
                          UNSOLD
                      </button>
                  </div>
                  <button
                    onClick={nextPlayer}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg border border-gray-600 transition"
                  >
                      NEXT PLAYER ⏭
                  </button>
              </div>
          )}

          {/* Bid History */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 flex-1 flex flex-col overflow-hidden">
               <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                   <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Live Feed</h3>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                   {bidHistory.length === 0 ? (
                       <p className="text-center text-gray-600 text-sm py-10">Waiting for bids...</p>
                   ) : (
                       bidHistory.map((bid, i) => (
                           <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-700/50 animate-fadeIn">
                               <div className="flex items-center space-x-3">
                                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                   <span className="font-bold text-white text-sm">{bid.team.name}</span>
                               </div>
                               <span className="font-mono text-green-400 font-bold">₹{(bid.amount/100000).toFixed(1)}L</span>
                           </div>
                       ))
                   )}
               </div>
          </div>
      </div>
    </div>
  );
};

export default Auction;
