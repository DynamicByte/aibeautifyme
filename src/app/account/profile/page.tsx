'use client';

import { useEffect, useState } from 'react';
import { UserProfile } from '@/lib/types';

interface ProfileData {
  id: string;
  email: string;
  name: string;
  skin_profile: UserProfile;
}

const skinTypes = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
const concernOptions = ['dark spots', 'fine lines', 'wrinkles', 'acne', 'dullness', 'uneven texture', 'large pores', 'dehydration'];
const goalOptions = ['brightening', 'anti-aging', 'hydration', 'acne control', 'even skin tone', 'firming'];
const ageRanges = ['20s', '30s', '40s', '50s+'];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [name, setName] = useState('');
  const [skinType, setSkinType] = useState<string>('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [age, setAge] = useState<string>('');

  useEffect(() => {
    fetch('/api/account/profile')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.data);
          setName(data.data.name);
          setSkinType(data.data.skin_profile.skinType || '');
          setConcerns(data.data.skin_profile.concerns || []);
          setGoals(data.data.skin_profile.goals || []);
          setAge(data.data.skin_profile.age || '');
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const toggleConcern = (concern: string) => {
    setConcerns(prev => 
      prev.includes(concern) 
        ? prev.filter(c => c !== concern)
        : [...prev, concern]
    );
  };

  const toggleGoal = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          skin_profile: {
            skinType,
            concerns,
            goals,
            age,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-1">Profile Settings</h1>
          <p className="text-text-3">Manage your account and skin profile</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 transition"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className="bg-surface-1 border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text-1">Account Information</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-1 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-text-1 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-1 mb-2">Username</label>
              <input
                type="text"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-text-3 cursor-not-allowed"
              />
              <p className="text-xs text-text-3 mt-1">Username cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Skin Type */}
        <div className="bg-surface-1 border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text-1">Skin Type</h2>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {skinTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSkinType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    skinType === type
                      ? 'bg-purple-700 text-white'
                      : 'bg-surface-2 text-text-2 hover:bg-surface-3'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skin Concerns */}
        <div className="bg-surface-1 border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text-1">Skin Concerns</h2>
            <p className="text-xs text-text-3">Select all that apply</p>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {concernOptions.map((concern) => (
                <button
                  key={concern}
                  onClick={() => toggleConcern(concern)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    concerns.includes(concern)
                      ? 'bg-purple-700 text-white'
                      : 'bg-surface-2 text-text-2 hover:bg-surface-3'
                  }`}
                >
                  {concern}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skincare Goals */}
        <div className="bg-surface-1 border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text-1">Skincare Goals</h2>
            <p className="text-xs text-text-3">Select all that apply</p>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {goalOptions.map((goal) => (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    goals.includes(goal)
                      ? 'bg-purple-700 text-white'
                      : 'bg-surface-2 text-text-2 hover:bg-surface-3'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Age Range */}
        <div className="bg-surface-1 border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text-1">Age Range</h2>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {ageRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setAge(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    age === range
                      ? 'bg-purple-700 text-white'
                      : 'bg-surface-2 text-text-2 hover:bg-surface-3'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
