import React, { useState } from 'react';
import { Player } from '../types';
import api from '../core/api';
import { toast } from 'react-hot-toast';

interface PlayerFormModalProps {
  player?: Player;
  onClose: () => void;
  onSuccess: () => void;
}

const PlayerFormModal: React.FC<PlayerFormModalProps> = ({ player, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: player?.name || '',
    date_of_birth: player?.date_of_birth || '',
    nationality: player?.nationality || 'India',
    state: player?.state || '',
    city: player?.city || '',
    role: player?.role || '',
    batting_style: player?.batting_style || '',
    bowling_style: player?.bowling_style || '',
    special_skills: player?.special_skills || '',
    matches_played: player?.matches_played || 0,
    runs_scored: player?.runs_scored || 0,
    wickets_taken: player?.wickets_taken || 0,
    base_price: player?.base_price || 0,
    phone_number: player?.phone_number || '',
    profile_photo_url: player?.profile_photo_url || '',
    is_approved: player?.is_approved ?? true, // Default true for admin
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const checked = e.target.checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        batting_style: formData.batting_style || null,
        bowling_style: formData.bowling_style || null,
        special_skills: formData.special_skills || null,
      };

      if (player) {
        await api.put(`/players/${player.id}`, payload);
        toast.success("Player updated");
      } else {
        await api.post('/players', payload);
        toast.success("Player created");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6">{player ? 'Edit Player' : 'Add Player'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-1">Name *</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600" required />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-1">Role *</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600" required>
                            <option value="">Select</option>
                            <option value="batsman">Batsman</option>
                            <option value="bowler">Bowler</option>
                            <option value="all_rounder">All Rounder</option>
                            <option value="wicket_keeper">Wicket Keeper</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-1">Base Price *</label>
                        <input name="base_price" type="number" value={formData.base_price} onChange={handleChange} className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600" required />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-1">Phone</label>
                        <input name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-1">City</label>
                        <input name="city" value={formData.city} onChange={handleChange} className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600" />
                    </div>
                     <div>
                        <label className="block text-gray-400 text-sm font-bold mb-1">Date of Birth</label>
                        <input name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600" />
                    </div>
                     <div>
                        <label className="block text-gray-400 text-sm font-bold mb-1">Photo URL</label>
                        <input name="profile_photo_url" value={formData.profile_photo_url} onChange={handleChange} className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600" />
                    </div>
                </div>

                <h3 className="text-gray-500 font-bold uppercase text-xs pt-4 border-t border-gray-700">Cricket Stats</h3>
                <div className="grid grid-cols-3 gap-4">
                     <div>
                        <label className="block text-gray-400 text-xs mb-1">Matches</label>
                        <input name="matches_played" type="number" value={formData.matches_played} onChange={handleChange} className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs mb-1">Runs</label>
                        <input name="runs_scored" type="number" value={formData.runs_scored} onChange={handleChange} className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs mb-1">Wickets</label>
                        <input name="wickets_taken" type="number" value={formData.wickets_taken} onChange={handleChange} className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600" />
                    </div>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                    <input
                        type="checkbox"
                        name="is_approved"
                        checked={formData.is_approved}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-white font-medium">Approved (Visible in Auction)</label>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:bg-gray-600"
                    >
                        {isLoading ? 'Saving...' : 'Save Player'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default PlayerFormModal;
