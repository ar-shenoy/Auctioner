import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../core/api';

const PlayerRegistration: React.FC = () => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Player name is required');
      return;
    }

    if (!role) {
      toast.error('Player role is required');
      return;
    }

    if (!basePrice || parseInt(basePrice) < 0) {
      toast.error('Base price must be a valid number');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        role: role,
        base_price: parseInt(basePrice),
      };

      await api.post('/players', payload);

      setRegistrationSuccess(true);
      setName('');
      setRole('');
      setBasePrice('');
      toast.success('Registration submitted successfully');

      // Reset success message after 5 seconds
      setTimeout(() => setRegistrationSuccess(false), 5000);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        'Failed to register player';
      toast.error(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl border border-gray-700/50 shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Cricket Auction</h1>
          <h2 className="text-xl font-semibold text-blue-400">Player Registration</h2>
          <p className="text-gray-400 text-sm mt-2">
            Register as a player to participate in the auction
          </p>
        </div>

        {registrationSuccess && (
          <div className="mb-6 p-4 bg-green-600/20 border border-green-600/50 rounded-lg">
            <p className="text-green-400 font-medium">
              ✓ Registration submitted successfully
            </p>
            <p className="text-green-300 text-sm mt-1">
              You will appear in the auction shortly
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Player Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isSubmitting}
              maxLength={255}
            />
          </div>

          {/* Player Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">
              Player Role *
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isSubmitting}
            >
              <option value="">Select a role</option>
              <option value="batsman">Batsman</option>
              <option value="bowler">Bowler</option>
              <option value="all_rounder">All-Rounder</option>
              <option value="wicket_keeper">Wicket Keeper</option>
            </select>
          </div>

          {/* Base Price */}
          <div>
            <label htmlFor="basePrice" className="block text-sm font-medium text-gray-300 mb-1">
              Base Price (₹) *
            </label>
            <input
              id="basePrice"
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="Enter your base price"
              className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isSubmitting}
              min="0"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {isSubmitting ? 'Submitting...' : 'Register as Player'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          * All fields are required
        </p>
      </div>
    </div>
  );
};

export default PlayerRegistration;
