import React, { useState, useEffect } from 'react';
import {
  User, Shield, Save, Check, RefreshCw, Sparkles, Dumbbell,
  Target, Calendar, Utensils, Trophy
} from 'lucide-react';
import { api } from '../api/client';
import { Profile } from '../types';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.profile.get();
      setProfile(res);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      // 1. Update Profile
      await api.profile.update(profile);
      // 2. Re-sync adaptive plan
      await api.profile.generatePlan(profile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleEquipment = (eq: string) => {
    if (!profile) return;
    const exists = profile.available_equipment.includes(eq);
    const updated = exists
      ? profile.available_equipment.filter((item) => item !== eq)
      : [...profile.available_equipment, eq];
    setProfile({ ...profile, available_equipment: updated });
  };

  const toggleDay = (day: string) => {
    if (!profile) return;
    const exists = profile.schedule_days.includes(day);
    if (exists && profile.schedule_days.length <= 1) return;
    const updated = exists
      ? profile.schedule_days.filter((d) => d !== day)
      : [...profile.schedule_days, day];
    setProfile({ ...profile, schedule_days: updated });
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <div className="text-sm font-semibold text-zinc-400">Loading athlete profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {/* Header */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Athlete Settings & Biometrics
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Athlete Profile</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Updating your profile dynamically re-synchronizes your RAG workout splits and nutritional targets.
          </p>
        </div>

        {user?.is_demo && (
          <span className="self-start sm:self-auto text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Demo Account Mode
          </span>
        )}
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-400" />
          Profile updated! Adaptive workout schedule and nutrition plan successfully recalculated.
        </div>
      )}

      {profile && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Biometrics Card */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-white">Biometrics & Body Composition</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Age</label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Gender</label>
                <input
                  type="text"
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={profile.height_cm}
                  onChange={(e) => setProfile({ ...profile, height_cm: Number(e.target.value) })}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.weight_kg}
                  onChange={(e) => setProfile({ ...profile, weight_kg: Number(e.target.value) })}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Goals & Conditioning Card */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-white">Training Goals & Experience</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Primary Goal</label>
                <select
                  value={profile.primary_goal}
                  onChange={(e) => setProfile({ ...profile, primary_goal: e.target.value })}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Fat Loss">Fat Loss</option>
                  <option value="Muscle Gain">Muscle Gain</option>
                  <option value="Body Recomposition">Body Recomposition</option>
                  <option value="Strength">Strength</option>
                  <option value="Endurance">Endurance</option>
                  <option value="General Fitness">General Fitness</option>
                  <option value="Sports Performance">Sports Performance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Fitness Level</label>
                <select
                  value={profile.fitness_level}
                  onChange={(e) => setProfile({ ...profile, fitness_level: e.target.value })}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Dietary Preference</label>
                <select
                  value={profile.dietary_preference}
                  onChange={(e) => setProfile({ ...profile, dietary_preference: e.target.value })}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="No Preference">No Preference</option>
                </select>
              </div>
            </div>
          </div>

          {/* Available Equipment Checkbox Grid */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-white">Available Training Equipment</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                'Bodyweight',
                'Dumbbells',
                'Barbell',
                'Bench',
                'Cable Machine',
                'Machines',
                'Resistance Bands',
                'Pull-up Bar',
                'Kettlebell',
                'Full Gym',
              ].map((eq) => {
                const isSelected = profile.available_equipment.includes(eq);
                return (
                  <div
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    className={`p-3 rounded-xl cursor-pointer border text-xs font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:border-white/15'
                    }`}
                  >
                    <span>{eq}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule Days Selection */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-white">Workout Schedule Days</h3>
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                (day) => {
                  const isSelected = profile.schedule_days.includes(day);
                  return (
                    <div
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`p-3 rounded-xl cursor-pointer border text-xs font-bold text-center transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:border-white/15'
                      }`}
                    >
                      <div>{day.slice(0, 3)}</div>
                      {isSelected && <Check className="w-3 h-3 text-emerald-400 mx-auto mt-1" />}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 text-black font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Re-calculating KRIDA Plan...' : 'Save & Re-sync Plan'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
