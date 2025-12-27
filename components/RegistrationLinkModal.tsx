
import React, { useState, useMemo } from 'react';
import { Team, Role } from '../types';
import { generateRegistrationToken } from '../core/auth';
import { toast } from 'react-hot-toast';

interface RegistrationLinkModalProps {
  teams: Team[];
  onClose: () => void;
}

const RegistrationLinkModal: React.FC<RegistrationLinkModalProps> = ({ teams, onClose }) => {
  const [selectedRole, setSelectedRole] = useState<Role>(Role.PLAYER);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [generatedLink, setGeneratedLink] = useState<string>('');

  const handleGenerate = () => {
    if (selectedRole === Role.MANAGER && !selectedTeamId) {
      toast.error('Please select a team for the Team Manager role.');
      return;
    }
    const token = generateRegistrationToken(selectedRole, selectedRole === Role.MANAGER ? selectedTeamId : undefined);
    const link = `${window.location.origin}${window.location.pathname}?page=register&token=${token}`;
    setGeneratedLink(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-8 w-full max-w-lg border border-gray-700/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-2xl font-bold text-white">Generate Registration Link</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={Role.PLAYER}>Player</option>
              <option value={Role.MANAGER}>Team Manager</option>
            </select>
          </div>
          {selectedRole === Role.MANAGER && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Team</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select a team</option>
                {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </div>
          )}
          <button
            onClick={handleGenerate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Generate Link
          </button>

          {generatedLink && (
            <div className="mt-4 p-3 bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-300 break-all">{generatedLink}</p>
              <button
                onClick={copyToClipboard}
                className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg text-sm"
              >
                Copy to Clipboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationLinkModal;
