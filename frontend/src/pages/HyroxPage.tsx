import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Zap,
  Activity,
  Clock,
  Gauge,
  ChevronRight,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Layers,
  Check,
  Dumbbell
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConditioningSession } from '../types';

interface StationInfo {
  num: number;
  name: string;
  officialDistance: string;
  openWeight: string;
  proWeight: string;
  targetPace: string;
  keyCue: string;
  homeSubstitute: string;
  fatigueRisk: string;
}

const HYROX_STATIONS: StationInfo[] = [
  {
    num: 1,
    name: 'SkiErg',
    officialDistance: '1,000m',
    openWeight: 'Damper 6',
    proWeight: 'Damper 6',
    targetPace: '3:45 - 4:10 min',
    keyCue: 'Drive through lats & hinge hips back. Do not squat the stroke.',
    homeSubstitute: 'Dumbbell Ski Swings (2 × 12kg) or Rower damper 8',
    fatigueRisk: 'Low leg fatigue; preserves hamstrings for Sled Push.'
  },
  {
    num: 2,
    name: 'Sled Push',
    officialDistance: '50m (4 × 12.5m)',
    openWeight: '102 kg',
    proWeight: '152 kg',
    targetPace: '2:15 - 3:15 min',
    keyCue: 'Arms locked straight, low 45° body angle, high knees marching cadence.',
    homeSubstitute: 'Turf Plate Push or 15% Incline Heavy Treadmill March',
    fatigueRisk: 'Extreme quad burn. First taste of compromised running.'
  },
  {
    num: 3,
    name: 'Sled Pull',
    officialDistance: '50m (4 × 12.5m)',
    openWeight: '78 kg',
    proWeight: '103 kg',
    targetPace: '3:30 - 4:45 min',
    keyCue: 'Stay inside the box. Deep squat anchor, hand-over-hand continuous rhythm.',
    homeSubstitute: 'Heavy Dumbbell Chest-Supported Rows or Towel Cable Rows',
    fatigueRisk: 'High forearm grip & hamstring stress.'
  },
  {
    num: 4,
    name: 'Burpee Broad Jumps',
    officialDistance: '80m',
    openWeight: 'Bodyweight',
    proWeight: 'Bodyweight',
    targetPace: '3:30 - 4:30 min',
    keyCue: 'Chest flat to turf, jump forward roughly your body height. Breathe on every landing.',
    homeSubstitute: 'Standard Burpees into Forward Leaps (40 reps total)',
    fatigueRisk: 'Massive cardiovascular spike into Zone 5 heart rate.'
  },
  {
    num: 5,
    name: 'Rowing Ergometer',
    officialDistance: '1,000m',
    openWeight: 'Damper 6',
    proWeight: 'Damper 6',
    targetPace: '3:40 - 4:05 min',
    keyCue: 'Power ratio 1:2. Drive legs first, open hips, then pull handle to sternum.',
    homeSubstitute: 'Assault Bike (60 kcal) or Elliptical at high resistance',
    fatigueRisk: 'Aerobic threshold test halfway through race.'
  },
  {
    num: 6,
    name: 'Farmers Carry',
    officialDistance: '200m (4 × 50m)',
    openWeight: '2 × 24 kg',
    proWeight: '2 × 32 kg',
    targetPace: '1:45 - 2:30 min',
    keyCue: 'Tall upright spine, active traps, short rapid footsteps.',
    homeSubstitute: 'Heavy Kettlebell / Dumbbell Suitcase or Double Carry',
    fatigueRisk: 'Grip blowout danger. Rest only once if essential.'
  },
  {
    num: 7,
    name: 'Sandbag Lunges',
    officialDistance: '100m (4 × 25m)',
    openWeight: '20 kg',
    proWeight: '30 kg',
    targetPace: '3:15 - 4:30 min',
    keyCue: 'Rear knee must softly touch floor, hips fully extend at top of every stride.',
    homeSubstitute: 'Dumbbell Front-Rack Lunges (2 × 12kg) or Barbell Lunges',
    fatigueRisk: 'Severe glute and adductor exhaustion right before running lap 8.'
  },
  {
    num: 8,
    name: 'Wall Balls',
    officialDistance: '100 Reps',
    openWeight: '6 kg (9ft target)',
    proWeight: '9 kg (10ft target)',
    targetPace: '3:45 - 5:15 min',
    keyCue: 'Full hip crease below knee crease in squat. Push with legs to launch ball.',
    homeSubstitute: 'Dumbbell Thrusters (2 × 8-10kg) with full squat lockout',
    fatigueRisk: 'Final barrier. Break into planned sets (e.g. 25-20-20-15-20).'
  }
];

const SESSION_TEMPLATES = [
  {
    id: 'aerobic-base',
    title: 'Aerobic Base Conditioning',
    focus: 'Zone 2 continuous pacing with low-intensity station cycling',
    duration: '45-60 mins',
    intensity: 'Zone 2 (Heart Rate 65-75% max)',
    protocol: '3 Rounds: 1,000m Easy Run + 500m SkiErg (Damper 4) + 100m Farmers Walk (Moderate weight). Zero rest between stations.',
  },
  {
    id: 'strength-endurance',
    title: 'Strength Endurance Protocol',
    focus: 'High mechanical load under compromised cardiovascular fatigue',
    duration: '50 mins',
    intensity: 'Zone 3-4 (Heart Rate 75-85% max)',
    protocol: '4 Rounds: 800m Tempo Run + 25m Sled Push (Heavy) + 25m Sled Pull + 25 Sandbag Lunges. Rest 90s between rounds.',
  },
  {
    id: 'intervals',
    title: 'High-Intensity Interval Repeats',
    focus: 'Compromised running threshold & lactate clearance',
    duration: '40 mins',
    intensity: 'Zone 4-5 (Heart Rate 85-95% max)',
    protocol: '5 Rounds: 1,000m Hard Run (Threshold Pace) + 1 Station to failure (alternate Burpees, Row, and Wall Balls). Rest 2 mins.',
  },
  {
    id: 'recovery',
    title: 'Active Recovery & Flush',
    focus: 'Lactate clearance, soft tissue mobility, and autonomic balance',
    duration: '35 mins',
    intensity: 'Zone 1 (Heart Rate <65% max)',
    protocol: '20 mins Easy Spin on Bike or Rower + 30 Light Dumbbell Thrusters + 15 mins Hip & Thoracic mobility drills.',
  }
];

export const HyroxPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stations' | 'templates' | 'tracker' | 'calculator'>('stations');
  const [division, setDivision] = useState<'open' | 'pro' | 'doubles'>('open');
  const [runPaceSec, setRunPaceSec] = useState<number>(285); // 4:45 pace
  const [selectedStationNum, setSelectedStationNum] = useState<number>(1);

  // Station substitution toggles: station num -> boolean (true = use substitute)
  const [useSubstitutions, setUseSubstitutions] = useState<Record<number, boolean>>({});

  // Conditioning Session Tracker State
  const [trackSessionType, setTrackSessionType] = useState('HYROX Station Simulation');
  const [trackTitle, setTrackTitle] = useState('4-Station Compromised Conditioning');
  const [trackDistanceMeters, setTrackDistanceMeters] = useState<number>(3000);
  const [trackDurationMinutes, setTrackDurationMinutes] = useState<number>(45);
  const [trackRounds, setTrackRounds] = useState<number>(3);
  const [trackRestSec, setTrackRestSec] = useState<number>(90);
  const [trackNotes, setTrackNotes] = useState<string>('Sled push replaced with plate push on turf');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading, demoLogin } = useAuth();
  const [savedSessions, setSavedSessions] = useState<ConditioningSession[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      api.hyrox.getSessions()
        .then((res) => {
          if (Array.isArray(res)) setSavedSessions(res);
        })
        .catch(() => {});
    } else {
      setSavedSessions([]);
    }
  }, [authLoading, isAuthenticated]);

  const selectedStation = HYROX_STATIONS.find((s) => s.num === selectedStationNum) || HYROX_STATIONS[0];

  // Calculate predicted finish time
  const calculatePredictedTime = () => {
    const totalRunTimeSec = 8 * runPaceSec;
    const stationAvgSec = division === 'pro' ? 245 : 210;
    const totalStationTimeSec = 8 * stationAvgSec;
    const roxzoneTransitionSec = 420; // 7 mins
    const totalSec = totalRunTimeSec + totalStationTimeSec + roxzoneTransitionSec;

    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs}h ${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleSaveSession = async () => {
    setIsSaving(true);
    try {
      await api.hyrox.logSession({
        session_type: trackSessionType,
        title: trackTitle,
        distance_meters: trackDistanceMeters,
        duration_seconds: trackDurationMinutes * 60,
        rounds_completed: trackRounds,
        rest_seconds: trackRestSec,
        stations_data_json: JSON.stringify(
          HYROX_STATIONS.map((s) => ({
            station: s.name,
            substituted: !!useSubstitutions[s.num],
            movement: useSubstitutions[s.num] ? s.homeSubstitute : s.name,
          }))
        ),
        notes: trackNotes,
      });

      setSaveSuccessMsg('Conditioning session logged and saved to database successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      const res = await api.hyrox.getSessions();
      if (Array.isArray(res)) setSavedSessions(res);
    } catch (err) {
      console.error('Failed to log HYROX session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222711] border border-[#3d471d] text-xs font-mono font-bold text-[#D7FF43] mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>05 • HYROX & COMPROMISED CONDITIONING</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            HYROX Conditioning & Station Protocols
          </h1>
          <p className="text-sm text-[#88A8C8] mt-0.5">
            Synchronized 1km compromised running intervals with 8 functional stations and home equipment substitutions.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#0e1113] border border-[#1a1f24] flex items-center gap-3">
          <Timer className="w-5 h-5 text-[#D7FF43]" />
          <div>
            <div className="text-[10px] font-mono text-[#88A8C8] uppercase font-bold">Estimated Finish</div>
            <div className="text-xs font-black text-white font-mono">{calculatePredictedTime()}</div>
          </div>
        </div>
      </div>

      {/* Prominent Unofficial Training Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-[#121618] border border-[#3d471d] text-xs text-[#88A8C8] flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-[#D7FF43] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Training Template Notice:</strong> Workouts presented herein are unofficial sports conditioning templates designed for physiological preparation and interval training. They are not official race prescriptions or commercial affiliations with HYROX.
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#1a1f24] pb-3">
        {[
          { id: 'stations', label: '8 Functional Stations & Swaps', icon: Layers },
          { id: 'templates', label: 'Conditioning Templates', icon: Activity },
          { id: 'tracker', label: 'Session Logger & History', icon: CheckCircle2 },
          { id: 'calculator', label: 'Race Pacing Calculator', icon: Gauge },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-[#222711] text-[#D7FF43] border border-[#3d471d] shadow-[0_0_10px_-2px_rgba(215,255,67,0.25)]'
                  : 'bg-[#0e1113] text-[#88A8C8] border border-[#1a1f24] hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: 8 FUNCTIONAL STATIONS WITH SUBSTITUTIONS */}
      {/* ============================================================ */}
      {activeTab === 'stations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HYROX_STATIONS.map((station) => {
              const isSubstituted = !!useSubstitutions[station.num];
              return (
                <div
                  key={station.num}
                  className="p-5 rounded-2xl bg-[#0e1113] border border-[#1a1f24] hover:border-[#D7FF43]/40 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-[#222711] text-[#D7FF43] font-mono text-xs font-bold flex items-center justify-center border border-[#3d471d]">
                        {station.num}
                      </span>
                      <h3 className="text-base font-bold text-white">{station.name}</h3>
                    </div>

                    <button
                      onClick={() =>
                        setUseSubstitutions((prev) => ({ ...prev, [station.num]: !prev[station.num] }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        isSubstituted
                          ? 'bg-[#222711] text-[#D7FF43] border border-[#3d471d]'
                          : 'bg-[#121618] text-[#88A8C8] border border-[#1e252a] hover:text-white'
                      }`}
                    >
                      {isSubstituted ? 'Substitute Active' : 'Toggle Home Swap'}
                    </button>
                  </div>

                  {/* Standard vs Substituted Details */}
                  <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a] text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#88A8C8]">Standard Target:</span>
                      <span className="text-white font-bold">{station.officialDistance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#88A8C8]">Open Load:</span>
                      <span className="text-[#D7FF43]">{station.openWeight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#88A8C8]">Target Pace:</span>
                      <span className="text-white">{station.targetPace}</span>
                    </div>

                    {isSubstituted && (
                      <div className="pt-2 border-t border-[#1e252a] text-xs">
                        <span className="text-amber-400 font-bold block mb-0.5">Home / Limited Gear Swap:</span>
                        <span className="text-white font-normal">{station.homeSubstitute}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-[#88A8C8] leading-relaxed">
                    <strong className="text-white">Pacing Cue: </strong> {station.keyCue}
                  </div>
                  <div className="text-[10px] font-mono text-amber-400/90">
                    ⚠ Fatigue Risk: {station.fatigueRisk}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: CONDITIONING SESSION TEMPLATES */}
      {/* ============================================================ */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SESSION_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24] hover:border-[#D7FF43]/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222711] text-[#D7FF43] border border-[#3d471d]">
                    {tmpl.duration}
                  </span>
                  <span className="text-[10px] font-mono text-[#88A8C8]">{tmpl.intensity}</span>
                </div>
                <h3 className="text-xl font-bold text-white">{tmpl.title}</h3>
                <p className="text-xs text-[#88A8C8] mt-1">{tmpl.focus}</p>

                <div className="mt-4 p-4 rounded-xl bg-[#121618] border border-[#1e252a] text-xs text-white leading-relaxed font-mono">
                  {tmpl.protocol}
                </div>
              </div>

              <button
                onClick={() => {
                  setTrackTitle(tmpl.title);
                  setTrackSessionType(tmpl.title);
                  setActiveTab('tracker');
                }}
                className="w-full py-2.5 rounded-xl bg-[#121618] hover:bg-[#222711] border border-[#1e252a] hover:border-[#3d471d] text-xs font-bold text-white hover:text-[#D7FF43] transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Track This Session
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SESSION TRACKER & LOGS */}
      {/* ============================================================ */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#3d471d] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1a1f24]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase tracking-wider">
                  PERSISTENT CONDITIONING RECORDER
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">Log Conditioning Session</h3>
                <p className="text-xs text-[#88A8C8] mt-1">
                  Track running distances, station loads, rounds completed, and rest intervals.
                </p>
              </div>

              <button
                onClick={handleSaveSession}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(215,255,67,0.25)] disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Record Session'}
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-[#222711] border border-[#3d471d] text-xs font-mono text-[#D7FF43] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {saveSuccessMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Total Running Distance (m)
                </label>
                <input
                  type="number"
                  value={trackDistanceMeters}
                  onChange={(e) => setTrackDistanceMeters(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Total Duration (minutes)
                </label>
                <input
                  type="number"
                  value={trackDurationMinutes}
                  onChange={(e) => setTrackDurationMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Rounds Completed
                </label>
                <input
                  type="number"
                  value={trackRounds}
                  onChange={(e) => setTrackRounds(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Rest Interval Between Rounds (s)
                </label>
                <input
                  type="number"
                  value={trackRestSec}
                  onChange={(e) => setTrackRestSec(parseInt(e.target.value, 10) || 60)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Equipment / Station Substitutions
                </label>
                <input
                  type="text"
                  value={trackNotes}
                  onChange={(e) => setTrackNotes(e.target.value)}
                  placeholder="e.g. Sled push swapped for dumbbell lunges"
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Past Conditioning Sessions Table */}
          <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-4">
            <h4 className="text-sm font-bold font-mono text-white uppercase">
              Completed Conditioning History ({savedSessions.length})
            </h4>

            {savedSessions.length > 0 ? (
              <div className="space-y-2">
                {savedSessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-[#121618] border border-[#1e252a] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{s.title}</div>
                      <div className="text-[11px] text-[#88A8C8] font-mono mt-0.5">
                        {s.distance_meters}m running • {Math.round(s.duration_seconds / 60)} mins • {s.rounds_completed} rounds
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-[#D7FF43] bg-[#222711] px-2.5 py-1 rounded-lg border border-[#3d471d] self-start sm:self-auto">
                      {s.completed_at?.slice(0, 10) || 'Recorded'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#88A8C8]">
                No conditioning sessions logged yet. Record your first session above!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: RACE PACING CALCULATOR */}
      {/* ============================================================ */}
      {activeTab === 'calculator' && (
        <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-6">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase tracking-wider">
              ESTIMATED SPLIT PREDICTOR
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">Race Finish Estimator</h3>
            <p className="text-xs text-[#88A8C8] mt-1">
              Computes total race pacing based on your 1km compromised interval target and chosen division.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Competition Division
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['open', 'pro', 'doubles'] as const).map((div) => (
                    <button
                      key={div}
                      onClick={() => setDivision(div)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                        division === div
                          ? 'bg-[#222711] text-[#D7FF43] border border-[#3d471d]'
                          : 'bg-[#121618] text-[#88A8C8] border border-[#1e252a]'
                      }`}
                    >
                      {div}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Target Compromised 1km Run Pace: {Math.floor(runPaceSec / 60)}:
                  {(runPaceSec % 60).toString().padStart(2, '0')} min/km
                </label>
                <input
                  type="range"
                  min="210"
                  max="420"
                  step="5"
                  value={runPaceSec}
                  onChange={(e) => setRunPaceSec(parseInt(e.target.value, 10))}
                  className="w-full accent-[#D7FF43]"
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#121618] border border-[#3d471d] flex flex-col justify-between space-y-4">
              <div>
                <div className="text-xs font-mono font-bold text-[#88A8C8] uppercase">
                  Total Predicted Finish Time
                </div>
                <div className="text-3xl font-black text-[#D7FF43] font-mono mt-1">
                  {calculatePredictedTime()}
                </div>
                <div className="text-[11px] text-[#88A8C8] mt-2 space-y-1 font-mono">
                  <div>• 8 × 1km Running: ~{Math.round((8 * runPaceSec) / 60)} mins</div>
                  <div>• 8 Stations: ~{Math.round((8 * (division === 'pro' ? 245 : 210)) / 60)} mins</div>
                  <div>• Roxzone Transitions: ~7 mins</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
