import React from 'react';
import { Page } from '../types';

interface PublicHeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onRegisterClick: () => void;
  onViewPlayersClick: () => void;
  onLoginClick: () => void;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({
  currentPage,
  setCurrentPage,
  onRegisterClick,
  onViewPlayersClick,
  onLoginClick
}) => {
  return (
    <div className="bg-[#2a0a55] border-b border-purple-800 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center shadow-lg">
      {/* Logo Section */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
             {/* Placeholder for Logo */}
             <span className="text-purple-900 font-bold text-[10px] sm:text-xs">A</span>
        </div>
        <h1 className="text-yellow-400 text-xl sm:text-3xl font-black tracking-wider italic drop-shadow-md">
          AUCTIONER
        </h1>
      </div>

      {/* Actions */}
      <div className="flex space-x-2 sm:space-x-4">
        <button
          onClick={onRegisterClick}
          className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-full font-bold transition-all transform hover:scale-105 text-xs sm:text-base ${
             // Using URL param or state to determine active?
             // For now just button styles.
             "bg-indigo-900 text-white border border-indigo-500 hover:bg-indigo-800"
          }`}
        >
          <span className="sm:hidden">Register</span>
          <span className="hidden sm:inline">Register Player</span>
        </button>
        <button
          onClick={onViewPlayersClick}
          className="px-3 py-1.5 sm:px-6 sm:py-2 rounded-full font-bold bg-yellow-500 text-black border border-yellow-400 hover:bg-yellow-400 hover:scale-105 transition-all shadow-[0_0_10px_rgba(234,179,8,0.5)] text-xs sm:text-base"
        >
          <span className="sm:hidden">Players</span>
          <span className="hidden sm:inline">View Players</span>
        </button>
        <button
          onClick={onLoginClick}
          className="px-2 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-purple-300 hover:text-white border border-transparent hover:border-purple-500 transition-all text-xs sm:text-sm"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default PublicHeader;
