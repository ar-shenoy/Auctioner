
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../core/api';

const PlayerRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    // Core Identity
    name: '',
    date_of_birth: '',
    nationality: 'India',
    state: '',
    city: '',

    // Cricket Profile
    role: '',
    batting_style: '',
    bowling_style: '',
    special_skills: '',

    // Performance
    matches_played: 0,
    runs_scored: 0,
    wickets_taken: 0,
    strike_rate: 0,
    economy_rate: 0,

    // Auction Metadata
    base_price: 2000000, // 20 Lakhs min? Or just 0
    expected_price: 0,
    availability_seasons: '2025',

    // Personal
    phone_number: '',
    bio: '',
    profile_photo_url: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    if (!formData.role) { toast.error('Role is required'); return; }
    if (!formData.date_of_birth) { toast.error('Date of Birth is required'); return; }
    if (!formData.phone_number) { toast.error('Phone number is required'); return; }
    if (formData.base_price < 0) { toast.error('Invalid base price'); return; }

    setIsSubmitting(true);

    try {
      // Clean payload
      const payload = {
        ...formData,
        expected_price: formData.expected_price || null,
        profile_photo_url: formData.profile_photo_url || null,
        special_skills: formData.special_skills || null,
        bio: formData.bio || null
      };

      await api.post('/players', payload);

      setRegistrationSuccess(true);
      toast.success('Registration submitted successfully!');

      // Redirect or clear
      setTimeout(() => {
          // Navigate to dashboard by clearing query params (App.tsx default)
          window.location.href = '/';
      }, 3000);

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

  if (registrationSuccess) {
      return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl border border-green-500/50 text-center">
                  <div className="text-6xl mb-4">🏏</div>
                  <h2 className="text-3xl font-bold text-white mb-2">Submission Received!</h2>
                  <p className="text-gray-400 mb-6">Your profile is now under review by the administrators.</p>
                  <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden">
        <div className="px-8 py-6 bg-gray-800 border-b border-gray-700">
          <h1 className="text-3xl font-bold text-white">Player Self-Registration</h1>
          <p className="text-gray-400 mt-2">Complete your official IPL Auction Profile</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">

            {/* Section 1: Identity */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-blue-400 border-b border-gray-700 pb-2">Core Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                        <input name="name" type="text" value={formData.name} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Date of Birth *</label>
                        <input name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nationality *</label>
                        <input name="nationality" type="text" value={formData.nationality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">State *</label>
                        <input name="state" type="text" value={formData.state} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">City *</label>
                        <input name="city" type="text" value={formData.city} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number *</label>
                        <input name="phone_number" type="tel" value={formData.phone_number} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" required />
                    </div>
                </div>
            </div>

            {/* Section 2: Cricket Profile */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-400 border-b border-gray-700 pb-2">Cricket Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" required>
                            <option value="">Select Role</option>
                            <option value="batsman">Batsman</option>
                            <option value="bowler">Bowler</option>
                            <option value="all_rounder">All-Rounder</option>
                            <option value="wicket_keeper">Wicket Keeper</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Batting Style *</label>
                        <select name="batting_style" value={formData.batting_style} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" required>
                            <option value="">Select Style</option>
                            <option value="right_hand">Right Hand</option>
                            <option value="left_hand">Left Hand</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Bowling Style *</label>
                        <select name="bowling_style" value={formData.bowling_style} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" required>
                            <option value="">Select Style</option>
                            <option value="fast">Fast</option>
                            <option value="medium">Medium</option>
                            <option value="spin">Spin</option>
                            <option value="na">None</option>
                        </select>
                    </div>
                    <div className="md:col-span-3">
                         <label className="block text-sm font-medium text-gray-300 mb-1">Special Skills</label>
                         <input name="special_skills" type="text" value={formData.special_skills} onChange={handleChange} placeholder="e.g. Pinch Hitter, Death Over Specialist" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                    </div>
                </div>
            </div>

            {/* Section 3: Performance */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-yellow-400 border-b border-gray-700 pb-2">Performance Metrics (Self-Declared)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Matches</label>
                        <input name="matches_played" type="number" min="0" value={formData.matches_played} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Runs</label>
                        <input name="runs_scored" type="number" min="0" value={formData.runs_scored} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Wickets</label>
                        <input name="wickets_taken" type="number" min="0" value={formData.wickets_taken} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Strike Rate</label>
                        <input name="strike_rate" type="number" step="0.01" value={formData.strike_rate} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white" />
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Economy</label>
                        <input name="economy_rate" type="number" step="0.01" value={formData.economy_rate} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white" />
                    </div>
                </div>
            </div>

            {/* Section 4: Auction */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-purple-400 border-b border-gray-700 pb-2">Auction Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Base Price (₹) *</label>
                        <input name="base_price" type="number" min="0" step="100000" value={formData.base_price} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono text-green-400" required />
                        <p className="text-xs text-gray-500 mt-1">Minimum bid to start auction</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Expected Price (Optional)</label>
                        <input name="expected_price" type="number" min="0" value={formData.expected_price} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Availability (Seasons)</label>
                        <input name="availability_seasons" type="text" value={formData.availability_seasons} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-gray-700 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                    {isSubmitting ? 'Submitting Application...' : 'Submit Official Profile'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerRegistration;
