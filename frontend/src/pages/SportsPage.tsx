import React, { useState, useEffect } from 'react';
import {
  Trophy, Activity, Dumbbell, Zap, Flame, Shield, ArrowRight,
  CheckCircle2, Target, Play, Compass
} from 'lucide-react';
import { api } from '../api/client';
import { SportsModule } from '../types';

export const SportsPage: React.FC = () => {
  const [sportsData, setSportsData] = useState<Record<string, SportsModule>>({});
  const [selectedSport, setSelectedSport] = useState<string>('HYROX');
  const [athleteLevel, setAthleteLevel] = useState<string>('Intermediate');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSports = async () => {
    setLoading(true);
    try {
      const res = await api.sports.getModules();
      setSportsData(res.sports);
      setAthleteLevel(res.athlete_level || 'Intermediate');
    } catch (err) {
      console.error('Failed to load sports modules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <div className="text-sm font-semibold text-zinc-400">Loading sports performance protocols...</div>
      </div>
    );
  }

  const currentModule = sportsData[selectedSport] || Object.values(sportsData)[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {/* Header */}
      <div className="pt-4">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" />
          Athletic Performance Engineering
        </span>
        <h1 className="text-3xl font-black text-white mt-1">Sports Performance Modes</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Specialized periodized protocols for hybrid functional racing, gymnastic leverage, and polarized endurance.
        </p>
      </div>

      {/* Sport Selector Carousel Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {Object.keys(sportsData).map((sportKey) => {
          const isSelected = selectedSport === sportKey;
          const mod = sportsData[sportKey];
          return (
            <button
              key={sportKey}
              onClick={() => setSelectedSport(sportKey)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'bg-zinc-900/60 border-white/5 hover:border-white/15'
              }`}
            >
              <div className="text-xs font-bold text-zinc-400 uppercase">{mod?.badge || 'Sport'}</div>
              <div className={`text-sm font-black mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                {sportKey}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Module Banner */}
      {currentModule && (
        <div className="glass-card p-6 sm:p-10 rounded-3xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                {currentModule.badge} • Calibrated for {athleteLevel}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">{currentModule.title}</h2>
              <p className="text-sm text-zinc-300 max-w-2xl mt-1 leading-relaxed">
                {currentModule.description}
              </p>
            </div>
          </div>

          {/* Station / Exercise Breakdown */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white">Movement Stations & Performance Standards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {currentModule.stations?.map((station, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-zinc-900/70 border border-white/5 hover:border-emerald-500/30 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-base flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-mono">
                        {idx + 1}
                      </span>
                      {station.station}
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      {station.target}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 pl-7 leading-relaxed">
                    Biomechanical Cue: <strong className="text-zinc-300">{station.focus}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated Training Complexes / Blocks */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-xl font-black text-white">Specific Conditioning Complexes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentModule.training_blocks?.map((block, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-zinc-950/80 border border-emerald-500/20 space-y-2"
                >
                  <div className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    {block.name}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{block.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
