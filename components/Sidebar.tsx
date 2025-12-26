
import React from 'react';
import { Page, User, Role } from '../types';
import DashboardIcon from './icons/DashboardIcon';
import PlayerIcon from './icons/PlayerIcon';
import TeamIcon from './icons/TeamIcon';
import AuctionIcon from './icons/AuctionIcon';

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
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 group ${
      isActive
        ? 'bg-gradient-to-r from-purple-800 to-indigo-900 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)] border border-purple-500/30'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white hover:pl-4'
    }`}
    onClick={onClick}
  >
    <span className={`${isActive ? 'text-yellow-400' : 'text-gray-500 group-hover:text-yellow-400'}`}>
        {icon}
    </span>
    <span className="ml-4 text-sm font-bold tracking-wide">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, currentUser, onLogout, isSidebarOpen, setIsSidebarOpen }) => {
  const allNavItems = [
    { page: Page.Dashboard, label: 'DASHBOARD', icon: <DashboardIcon />, roles: [Role.ADMIN, Role.MANAGER, Role.PLAYER] },
    { page: Page.Players, label: 'PLAYERS', icon: <PlayerIcon />, roles: [Role.ADMIN, Role.MANAGER, Role.PLAYER] },
    { page: Page.Teams, label: 'TEAMS', icon: <TeamIcon />, roles: [Role.ADMIN, Role.MANAGER] },
    { page: Page.Auction, label: 'AUCTION ROOM', icon: <AuctionIcon />, roles: [Role.ADMIN, Role.MANAGER] },
  ];
  
  const availableNavItems = allNavItems.filter(item => currentUser && item.roles.includes(currentUser.role));

  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-70 z-20 md:hidden transition-opacity duration-300 backdrop-blur-sm ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-[#0f1014] border-r border-gray-800 p-6 flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex-shrink-0">
          <div className="flex items-center mb-10 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                 <span className="font-black text-black text-xl">A</span>
            </div>
            <h1 className="text-2xl font-black ml-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 italic">AUCTIONER</h1>
          </div>
          <nav>
            <ul className="space-y-2">
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
        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 mb-4">
              <p className="text-sm font-bold text-white tracking-wide">{currentUser?.username}</p>
              <p className="text-xs text-yellow-500 font-mono mt-1 uppercase">{currentUser?.role}</p>
          </div>
          <button
              onClick={onLogout}
              className="w-full flex items-center justify-center p-3 rounded-xl cursor-pointer bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-all duration-200 border border-red-900/30 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            <span className="ml-2 text-sm font-bold">LOGOUT</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
