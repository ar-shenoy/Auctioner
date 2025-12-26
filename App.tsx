
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AdminDashboard from './pages/AdminDashboard';
import PublicPlayerList from './pages/PublicPlayerList';
import PublicHeader from './components/PublicHeader';
import Players from './pages/Players';
import Teams from './pages/Teams';
import Auction from './pages/Auction';
import PlayerRegistration from './pages/PlayerRegistration';
import { Page, Player, Team, User, Role } from './types';
import { Toaster } from 'react-hot-toast';
import AdminPanel from './components/AdminPanel';
import Login from './pages/Login';
import { getCurrentUser, getMe, logout as apiLogout } from './core/auth';
import HamburgerIcon from './components/icons/HamburgerIcon';
import api from './core/api';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(!currentUser);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Restore session
  useEffect(() => {
    if (localStorage.getItem('access_token')) {
         getMe().then((user) => {
            if (user) setCurrentUser(user);
            setIsLoadingUser(false);
          }).catch(() => {
            setCurrentUser(null);
            setIsLoadingUser(false);
          });
    } else {
        setIsLoadingUser(false);
    }
  }, []);

  // Fetch data
  useEffect(() => {
     fetchData();
  }, [currentUser]);

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
      if (error.response?.status === 401 || error.response?.status === 403) {
          if (currentUser) handleLogout();
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage(Page.Dashboard);
  };

  const handleLogout = () => {
    apiLogout();
    setCurrentUser(null);
    setCurrentPage(Page.Dashboard);
  };
  
  const renderPage = () => {
    if (isLoadingData && players.length === 0) {
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
        return <PublicPlayerList players={players} teams={teams} />;
    }

    // Authenticated Pages
    switch (currentPage) {
      case Page.Dashboard:
        return <AdminDashboard players={players} teams={teams} onDataChange={fetchData} />;
      case Page.Players:
        return <Players players={players} setPlayers={setPlayers} currentUser={currentUser} onDataChange={fetchData} />;
      case Page.Teams:
        return <Teams teams={teams} setTeams={setTeams} currentUser={currentUser} onDataChange={fetchData} />;
      case Page.Auction:
        return <Auction allPlayers={players} teams={teams} setTeams={setTeams} currentUser={currentUser} onDataChange={fetchData} />;
      case Page.PlayerRegistration:
        return <PlayerRegistration />;
      default:
        return <AdminDashboard players={players} teams={teams} onDataChange={fetchData} />;
    }
  };

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  if (urlParams.get('page') === 'player-register') {
      return <PlayerRegistration />;
  }

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Public Layout
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

  // Admin Layout
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
