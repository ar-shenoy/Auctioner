
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Teams from './pages/Teams';
import Auction from './pages/Auction';
import Simulation from './pages/Simulation';
import LiveMatch from './pages/LiveMatch';
import { Page, Player, Team, User, Role } from './types';
import { getPlayers, getTeams, updatePlayerStats } from './core/db';
import { Toaster, toast } from 'react-hot-toast';
import AdminPanel from './components/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import { getCurrentUser, login as apiLogin, logout as apiLogout } from './core/auth';
import HamburgerIcon from './components/icons/HamburgerIcon';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [players, setPlayers] = useState<Player[]>(getPlayers());
  const [teams, setTeams] = useState<Team[]>(getTeams());

  const handleLogin = (user: User) => {
    apiLogin(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    apiLogout();
    setCurrentUser(null);
    setCurrentPage(Page.Dashboard);
  };
  
  const handlePlayerStatsUpdate = (playerId: string, performance: { runs?: number, wickets?: number }) => {
      const updatedPlayers = updatePlayerStats(playerId, performance);
      setPlayers(updatedPlayers);
  };


  const renderPage = () => {
    switch (currentPage) {
      case Page.Dashboard:
        return <Dashboard players={players} teams={teams} />;
      case Page.Players:
        return <Players players={players} setPlayers={setPlayers} currentUser={currentUser} />;
      case Page.Teams:
        return <Teams teams={teams} setTeams={setTeams} currentUser={currentUser} />;
      case Page.Auction:
        return <Auction allPlayers={players} teams={teams} setTeams={setTeams} currentUser={currentUser} />;
      case Page.Simulation:
        return <Simulation teams={teams} />;
      case Page.LiveMatch:
        return <LiveMatch teams={teams} onStatUpdate={handlePlayerStatsUpdate} currentUser={currentUser} />;
      default:
        return <Dashboard players={players} teams={teams} />;
    }
  };

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  if (urlParams.get('page') === 'register' && urlParams.get('token')) {
    return <Register token={urlParams.get('token')!} />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
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
