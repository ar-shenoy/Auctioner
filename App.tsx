
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AdminDashboard from './pages/AdminDashboard';
import PublicPlayerList from './pages/PublicPlayerList';
import PublicHeader from './components/PublicHeader';
import Players from './pages/Players';
import Teams from './pages/Teams';
import Auction from './pages/Auction';
import Simulation from './pages/Simulation';
import LiveMatch from './pages/LiveMatch';
import PlayerRegistration from './pages/PlayerRegistration';
import { Page, Player, Team, User, Role } from './types';
import { Toaster } from 'react-hot-toast';
import AdminPanel from './components/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import { getCurrentUser, getMe, logout as apiLogout } from './core/auth';
import HamburgerIcon from './components/icons/HamburgerIcon';
import api from './core/api';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(!currentUser); // If no user initially, we might be loading or just public.
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Restore session from backend on app load
  useEffect(() => {
    // Only try to fetch user if we think we might have one (e.g. token exists)
    // Actually, getMe() checks token validity.
    // If no token in localstorage, getCurrentUser() returns null.

    if (localStorage.getItem('access_token')) {
         getMe().then((user) => {
            if (user) setCurrentUser(user);
            setIsLoadingUser(false);
          }).catch(() => {
            // Token invalid
            setCurrentUser(null);
            setIsLoadingUser(false);
          });
    } else {
        setIsLoadingUser(false);
    }
  }, []);

  // Fetch data always (public or private)
  useEffect(() => {
     fetchData();
  }, [currentUser]); // Re-fetch if user changes (permissions might change)

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [playersRes, teamsRes] = await Promise.all([
        api.get('/players'),
        api.get('/teams'),
      ]);
      setPlayers(playersRes.data);
      setTeams(teamsRes.data);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      // If 403/401, maybe we are trying to access admin routes?
      // But /players and /teams should be public now (teams might need update).
      // If /teams is still protected, this might fail.
      if (error.response?.status === 401 || error.response?.status === 403) {
          // If we were logged in, logout.
          if (currentUser) handleLogout();
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // After login, default to Admin Dashboard if admin
    setCurrentPage(Page.Dashboard);
  };

  const handleLogout = () => {
    apiLogout();
    setCurrentUser(null);
    setCurrentPage(Page.Dashboard);
  };
  
  const handlePlayerStatsUpdate = (playerId: string, performance: { runs?: number, wickets?: number }) => {
    fetchData();
  };

  const renderPage = () => {
    if (isLoadingData && players.length === 0) {
       // Only show loading if we have NO data.
       // Otherwise show stale data while refreshing?
       // For now simple loading.
       return (
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="text-gray-400">Loading...</div>
        </div>
      );
    }

    // Public Pages
    if (!currentUser) {
        if (currentPage === Page.PlayerRegistration) {
            return <PlayerRegistration />;
        }
        if (currentPage === Page.Login) {
            return <Login onLogin={handleLogin} />;
        }
        // Default to Public Player List for Dashboard or any other protected page
        return <PublicPlayerList players={players} teams={teams} />;
    }

    // Authenticated Pages
    switch (currentPage) {
      case Page.Dashboard:
        return <AdminDashboard players={players} teams={teams} />;
      case Page.Players:
        return <Players players={players} setPlayers={setPlayers} currentUser={currentUser} onDataChange={fetchData} />;
      case Page.Teams:
        return <Teams teams={teams} setTeams={setTeams} currentUser={currentUser} onDataChange={fetchData} />;
      case Page.Auction:
        return <Auction allPlayers={players} teams={teams} setTeams={setTeams} currentUser={currentUser} onDataChange={fetchData} />;
      case Page.Simulation:
        return <Simulation teams={teams} />;
      case Page.LiveMatch:
        return <LiveMatch teams={teams} onStatUpdate={handlePlayerStatsUpdate} currentUser={currentUser} />;
      case Page.PlayerRegistration:
        return <PlayerRegistration />; // Admin/Manager can also see this?
      default:
        return <AdminDashboard players={players} teams={teams} />;
    }
  };

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  if (urlParams.get('page') === 'register' && urlParams.get('token')) {
    return <Register token={urlParams.get('token')!} />;
  }

  // Legacy query param support or direct link support
  if (urlParams.get('page') === 'player-register') {
      // We can just render the component directly
      return <PlayerRegistration />;
  }

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Layout Decision
  if (!currentUser) {
      return (
        <div className="min-h-screen bg-[#1a1a1a] font-sans">
             <PublicHeader
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onRegisterClick={() => setCurrentPage(Page.PlayerRegistration)}
                onViewPlayersClick={() => setCurrentPage(Page.Dashboard)}
                onLoginClick={() => setCurrentPage(Page.Login)}
             />
             <Toaster position="top-right" />
             <main>
                {renderPage()}
             </main>
        </div>
      );
  }

  return (
    <div className="relative min-h-screen md:flex bg-gray-900 text-gray-200 font-sans">
      <Toaster position="top-right" />

      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        currentUser={currentUser} 
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col">
        <header className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-700/50 md:border-none">
            <div className="flex items-center">
                <button className="text-gray-400 focus:outline-none md:hidden" onClick={() => setIsSidebarOpen(true)}>
                    <HamburgerIcon className="h-6 w-6" />
                </button>
                <h1 className="text-xl md:text-3xl font-bold text-white capitalize ml-4 md:ml-0">{currentPage.replace('-', ' ')}</h1>
            </div>
            {currentUser.role === Role.ADMIN && <AdminPanel teams={teams} />}
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-800 p-4 sm:p-6 lg:p-8">
            {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
