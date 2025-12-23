
import React, { useState } from 'react';
import { Team } from '../types';
import RegistrationLinkModal from './RegistrationLinkModal';

interface AdminPanelProps {
  teams: Team[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ teams }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors duration-200"
      >
        Generate Registration Link
      </button>
      {isModalOpen && <RegistrationLinkModal teams={teams} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default AdminPanel;
