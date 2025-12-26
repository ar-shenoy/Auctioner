
import React, { useState } from 'react';
import { Team } from '../types';
interface AdminPanelProps {
  teams: Team[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ teams }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex items-center space-x-4">
    </div>
  );
};

export default AdminPanel;
