
import React from 'react';
import { Page, User, Role } from '../types';
import DashboardIcon from './icons/DashboardIcon';
import PlayerIcon from './icons/PlayerIcon';
import TeamIcon from './icons/TeamIcon';
import AuctionIcon from './icons/AuctionIcon';
import TrophyIcon from './icons/TrophyIcon';
import LiveIcon from './icons/LiveIcon';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  currentUser: User | null;
  onLogout: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600 text-white shadow-lg'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}
    onClick={onClick}
  >
    {icon}
    <span className="ml-4 text-sm font-medium">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, currentUser, onLogout, isSidebarOpen, setIsSidebarOpen }) => {
  const allNavItems = [
    { page: Page.Dashboard, label: 'Dashboard', icon: <DashboardIcon />, roles: [Role.ADMIN, Role.MANAGER, Role.PLAYER] },
    { page: Page.Players, label: 'Players', icon: <PlayerIcon />, roles: [Role.ADMIN, Role.MANAGER, Role.PLAYER] },
    { page: Page.Teams, label: 'Teams', icon: <TeamIcon />, roles: [Role.ADMIN, Role.MANAGER] },
    { page: Page.Auction, label: 'Auction', icon: <AuctionIcon />, roles: [Role.ADMIN, Role.MANAGER] },
    { page: Page.Simulation, label: 'Simulation', icon: <TrophyIcon />, roles: [Role.ADMIN, Role.MANAGER] },
    { page: Page.LiveMatch, label: 'Live Match', icon: <LiveIcon />, roles: [Role.ADMIN, Role.MANAGER] },
  ];
  
  const availableNavItems = allNavItems.filter(item => currentUser && item.roles.includes(currentUser.role));

  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false); // Close sidebar on navigation
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 border-r border-gray-700/50 p-4 flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex-shrink-0">
          <div className="flex items-center mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h2a1 1 0 011 1v2a1 1 0 001 1v3a1 1 0 00-1 1v2a1 1 0 01-1 1h-2a1 1 0 00-1 1v.5a1.5 1.5 0 01-3 0V16a1 1 0 00-1-1H7a1 1 0 01-1-1v-2a1 1 0 00-1-1V8a1 1 0 001-1V5a1 1 0 011-1h2a1 1 0 001-1v-.5z" />
            </svg>
            <h1 className="text-xl font-bold ml-2">Cricket Ops</h1>
          </div>
          <nav>
            <ul>
              {availableNavItems.map((item) => (
                <NavItem
                  key={item.page}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentPage === item.page}
                  onClick={() => handleNavClick(item.page)}
                />
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-auto">
          <div className="p-3 bg-gray-800 rounded-lg text-left mb-4">
              <p className="text-sm font-semibold text-white">{currentUser?.username}</p>
              <p className="text-xs text-blue-400">{currentUser?.role}</p>
          </div>
          <button
              onClick={onLogout}
              className="w-full flex items-center justify-center p-3 rounded-lg cursor-pointer bg-red-600/80 hover:bg-red-600 text-white transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            <span className="ml-2 text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
