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
    <div className="bg-[#2a0a55] border-b border-purple-800 px-6 py-4 flex justify-between items-center shadow-lg">
      {/* Logo Section */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
             {/* Placeholder for Logo */}
             <span className="text-purple-900 font-bold text-xs">LOGO</span>
        </div>
        <h1 className="text-yellow-400 text-3xl font-black tracking-wider italic drop-shadow-md">
          CCL <span className="text-white">2026</span>
        </h1>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={onRegisterClick}
          className={`px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 ${
             // Using URL param or state to determine active?
             // For now just button styles.
             "bg-indigo-900 text-white border border-indigo-500 hover:bg-indigo-800"
          }`}
        >
          Register Player
        </button>
        <button
          onClick={onViewPlayersClick}
          className="px-6 py-2 rounded-full font-bold bg-yellow-500 text-black border border-yellow-400 hover:bg-yellow-400 hover:scale-105 transition-all shadow-[0_0_10px_rgba(234,179,8,0.5)]"
        >
          View Players
        </button>
        <button
          onClick={onLoginClick}
          className="px-4 py-2 rounded-full font-semibold text-purple-300 hover:text-white border border-transparent hover:border-purple-500 transition-all text-sm"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default PublicHeader;
