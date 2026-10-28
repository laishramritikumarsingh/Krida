import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Flame,
  Shield,
  ChevronRight,
  CheckCircle2,
  Trophy,
  Activity,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Layers,
  Check,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { SkillProgress } from '../types';

interface ProgressionStep {
  level: number;
  name: string;
  focus: string;
  prerequisites: string;
  regressions: string;
  cues: string[];
}

interface SkillData {
  id: string;
  title: string;
  category: string;
  equipment: string;
  difficulty: string;
  targetVolume: string;
  description: string;
  levels: ProgressionStep[];
}

const ALL_SKILLS: SkillData[] = [
  {
    id: 'push-ups',
    title: 'Push-Up Progression',
    category: 'Horizontal Pushing',
    equipment: 'Bodyweight',
    difficulty: 'Beginner to Advanced',
    targetVolume: '3-4 sets × 10-25 reps',
    description: 'Foundational anterior kinetic chain builder developing pectoral force, serratus anterior stabilization, and anti-extension core control.',
    levels: [
      {
        level: 1,
        name: 'Incline / Hands-Elevated Push-Ups',
        focus: 'Establishing rigid plank alignment and elbow tuck angle (45°)',
        prerequisites: '30s standard plank',
        regressions: 'Wall push-ups or higher incline bench',
        cues: ['Keep glutes clenched tightly', 'Elbows track at 45 degrees, not flared', 'Chest touches elevation edge']
      },
      {
        level: 2,
        name: 'Strict Floor Push-Ups',
        focus: 'Full bodyweight resistance through complete range of motion',
        prerequisites: '15 clean incline push-ups',
        regressions: 'Eccentric 4-second negatives to floor',
        cues: ['Forearms stay perpendicular to floor', 'Drive palms through the floor at lockout']
      },
      {
        level: 3,
        name: 'Diamond Push-Ups',
        focus: 'Triceps lateral head overload and sternal pectoral recruitment',
        prerequisites: '20 strict floor push-ups',
        regressions: 'Hands slightly separated (semi-diamond)',
        cues: ['Index fingers and thumbs forming diamond', 'Do not allow lower back to sag']
      },
      {
        level: 4,
        name: 'Archer & Pseudo Planche Push-Ups',
        focus: 'Unilateral moment arm leverage and anterior deltoid protraction',
        prerequisites: '15 diamond push-ups with zero fatigue breakdown',
        regressions: 'Wide push-ups with 2s eccentric pause',
        cues: ['Lean forward past wrist line for pseudo planche', 'Straight arm slides wide for archer']
      }
    ]
  },
  {
    id: 'pull-ups',
    title: 'Pull-Up Progression',
    category: 'Vertical Pulling',
    equipment: 'Pull-Up Bar',
    difficulty: 'Beginner to Advanced',
    targetVolume: '4-5 sets × 5-12 reps',
    description: 'The cornerstone vertical latissimus dorsi and upper back compound exercise. Essential prerequisite for all dynamic calisthenics.',
    levels: [
      {
        level: 1,
        name: 'Dead Hangs & Scapular Pull-Ups',
        focus: 'Grip endurance, shoulder decompression, and active scapular depression',
        prerequisites: 'None',
        regressions: 'Feet-supported dead hang',
        cues: ['Depress shoulder blades down away from ears', 'Hold 45s unbroken before advancing']
      },
      {
        level: 2,
        name: 'Inverted Bodyweight Rows / Banded Pull-Ups',
        focus: 'Horizontal pull foundation and assisted vertical groove',
        prerequisites: '45s dead hang',
        regressions: 'Higher bar angle on inverted row',
        cues: ['Chest touches the bar', 'Drive elbows backward behind torso']
      },
      {
        level: 3,
        name: 'Strict Dead-Hang Pull-Ups',
        focus: 'Full range of motion from complete elbow extension to chin over bar',
        prerequisites: '8 clean eccentric negatives or heavy band pull-ups',
        regressions: 'Resistance band assist or slow 5s eccentric lowers',
        cues: ['Zero kipping or knee kicking', 'Lead with upper chest toward bar']
      },
      {
        level: 4,
        name: 'L-Sit Pull-Ups & Weighted Pull-Ups',
        focus: 'Core anti-extension integration and progressive mechanical resistance',
        prerequisites: '12 strict dead-hang pull-ups',
        regressions: 'Tuck L-sit pull-up',
        cues: ['Legs locked completely parallel to floor', 'Full dead-hang lockout on every single repetition']
      }
    ]
  },
  {
    id: 'dips',
    title: 'Parallel Bar Dips',
    category: 'Vertical Pushing',
    equipment: 'Parallel Bars or Dip Station',
    difficulty: 'Intermediate to Advanced',
    targetVolume: '4 sets × 8-15 reps',
    description: 'Massive builder of triceps extension force, anterior deltoid load, and clavicular/sternal pectoral drive.',
    levels: [
      {
        level: 1,
        name: 'Bench Dips & Top Support Hold',
        focus: 'Scapular depression at top lockout and bicep/tricep tendon conditioning',
        prerequisites: '20 strict floor push-ups',
        regressions: 'Knees bent bench dips with feet flat',
        cues: ['Keep spine close to bench edge', 'Depress shoulders down strongly in top support']
      },
      {
        level: 2,
        name: 'Banded / Negative Bar Dips',
        focus: 'Controlling 4-second eccentric descent on parallel bars',
        prerequisites: '45s solid top support hold on bars',
        regressions: 'Foot-assisted dip machine or band',
        cues: ['Lean torso slightly forward 15-20°', 'Lower until upper arm is parallel to floor']
      },
      {
        level: 3,
        name: 'Strict Parallel Bar Dips',
        focus: 'Full bodyweight pressing power through complete 90° depth',
        prerequisites: '6 controlled 4s negative dips',
        regressions: 'Light resistance band assist',
        cues: ['Lock elbows at top', 'Do not shrug shoulders toward ears']
      },
      {
        level: 4,
        name: 'Straight-Bar Dips & Weighted Dips',
        focus: 'Transition groove for muscle-ups and heavy overload capacity',
        prerequisites: '15 strict parallel dips',
        regressions: 'Bodyweight straight-bar dips with band',
        cues: ['Lean chest over the single bar', 'Push through palms to full lockout']
      }
    ]
  },
  {
    id: 'handstands',
    title: 'Freestanding Handstand',
    category: 'Inverted Balance & Overhead Press',
    equipment: 'Wall or Floor',
    difficulty: 'Intermediate to Elite',
    targetVolume: '5 sets × 20-45s holds',
    description: 'Mastery of vestibular balance, wrist flexor micro-adjustments, and hollow-body shoulder flexion overhead.',
    levels: [
      {
        level: 1,
        name: 'Elevated Pike Hold & Wall Walk',
        focus: 'Inverted weight bearing and active shoulder elevation (shrug)',
        prerequisites: '20 strict floor push-ups',
        regressions: 'Pike push-up hold on floor',
        cues: ['Push the floor away through your palms', 'Tuck chin slightly to look between thumbs']
      },
      {
        level: 2,
        name: 'Chest-to-Wall Handstand Hold',
        focus: 'Perfect straight line alignment without lumbar hyperextension',
        prerequisites: '30s elevated pike hold',
        regressions: 'Back-to-wall hold with feet walked lower',
        cues: ['Only toes and nose touch wall', 'Glutes squeezed, ribcage pulled down into hollow body']
      },
      {
        level: 3,
        name: 'Freestanding Kick-Up & Bail Groove',
        focus: 'Learning the pirouette bail safety exit and balance threshold',
        prerequisites: '45s clean chest-to-wall hold',
        regressions: 'One foot tapped lightly off wall',
        cues: ['Fingertips act as brakes when tipping over', 'Heel of hand pushes when falling back']
      },
      {
        level: 4,
        name: 'Freestanding Handstand & Handstand Push-Up',
        focus: 'Sustained 30s+ freestanding hold and vertical eccentric press',
        prerequisites: 'Consistent kick-up with 10s balance',
        regressions: 'Wall-assisted deficit handstand push-ups',
        cues: ['Micro-adjust via grip claw into turf', 'Maintain rigid kinetic chain from toes to wrists']
      }
    ]
  },
  {
    id: 'l-sits',
    title: 'L-Sit to V-Sit',
    category: 'Core Compression & Scapular Depression',
    equipment: 'Floor, Parallettes, or Dip Bars',
    difficulty: 'Beginner to Advanced',
    targetVolume: '4-5 sets × 15-30s holds',
    description: 'Uncompromising test of hip flexor compression strength, quadriceps active extension, and locked triceps support.',
    levels: [
      {
        level: 1,
        name: 'Tuck L-Sit on Floor / Parallettes',
        focus: 'Lifting entire pelvis off ground with knees tucked tightly to chest',
        prerequisites: '45s hollow body hold',
        regressions: 'Tuck L-sit on parallel dip bars for elevation clearance',
        cues: ['Push palms down into floor to elevate hips', 'Do not let feet touch turf']
      },
      {
        level: 2,
        name: 'One-Leg Extended L-Sit',
        focus: 'Extending one knee straight while holding opposite leg tucked',
        prerequisites: '20s clean tuck hold',
        regressions: 'Alternate legs every 5 seconds',
        cues: ['Point toe on extended leg', 'Keep chest proud and shoulders depressed']
      },
      {
        level: 3,
        name: 'Full L-Sit',
        focus: 'Both legs completely straight forming crisp 90° angle with torso',
        prerequisites: '15s single-leg holds each side',
        regressions: 'Low-angle L-sit on parallettes',
        cues: ['Contract quads hard to lock knees', 'Maintain active scapular push throughout hold']
      },
      {
        level: 4,
        name: 'Straddle L-Sit & High V-Sit',
        focus: 'Extreme active compression bringing toes up to chest/eye level',
        prerequisites: '20s solid full L-sit on floor',
        regressions: 'Pike compression lifts on floor',
        cues: ['Lean torso slightly backward to counter-balance rising legs', 'Lock elbows completely']
      }
    ]
  },
  {
    id: 'front-lever',
    title: 'Front Lever',
    category: 'Horizontal Scapular Depression & Core Chain',
    equipment: 'Pull-Up Bar or Rings',
    difficulty: 'Advanced to Elite',
    targetVolume: '5-6 sets × 8-15s holds',
    description: 'Isometric horizontal suspension requiring maximum latissimus dorsi torque, posterior deltoid activation, and core anti-extension power.',
    levels: [
      {
        level: 1,
        name: 'Tuck Front Lever',
        focus: 'Scapular depression and horizontal back alignment with knees tucked',
        prerequisites: '10 strict dead-hang pull-ups',
        regressions: 'Scapular pulls and inverted tuck row holds',
        cues: ['Arms stay completely straight (zero elbow bend)', 'Pull bar down towards your hips']
      },
      {
        level: 2,
        name: 'Advanced Tuck Front Lever',
        focus: 'Extending hip angle to 90° to increase moment arm leverage',
        prerequisites: '20s clean tuck front lever',
        regressions: 'Band-assisted advanced tuck hold',
        cues: ['Flatten lower back completely level with floor', 'Chest puffed upward towards ceiling']
      },
      {
        level: 3,
        name: 'Single-Leg / Straddle Front Lever',
        focus: 'Progressive center-of-mass extension',
        prerequisites: '15s solid advanced tuck hold',
        regressions: 'One leg extended, other leg tucked to chest',
        cues: ['Alternate lead leg each set', 'Ensure hips do not sag below shoulder plane']
      },
      {
        level: 4,
        name: 'Full Front Lever',
        focus: 'Complete horizontal suspension from head to pointed toes',
        prerequisites: '10s straddle lever or single-leg holds',
        regressions: 'Resistance band anchored to bar holding feet',
        cues: ['Squeeze glutes, adductors, and lats together into one rigid plank']
      }
    ]
  },
  {
    id: 'muscle-up',
    title: 'Strict Bar Muscle-Up',
    category: 'Dynamic Pull & Transition',
    equipment: 'Pull-Up Bar',
    difficulty: 'Advanced to Elite',
    targetVolume: '5 sets × 2-5 reps',
    description: 'The definitive calisthenics milestone combining rapid explosive vertical pulling with a false-grip transition into straight-bar dip lockout.',
    levels: [
      {
        level: 1,
        name: 'Explosive High Pull-Ups (Sternum Level)',
        focus: 'Developing peak rate of force development above chin height',
        prerequisites: '12 strict dead-hang pull-ups',
        regressions: 'Fast-concentric band pull-ups',
        cues: ['Pull aggressively towards lower ribcage', 'Zero kipping or knee swing']
      },
      {
        level: 2,
        name: 'Deep Straight-Bar Dips & False-Grip Conditioning',
        focus: 'Strengthening the low transition angle and wrist turnover mobility',
        prerequisites: '15 parallel bar dips',
        regressions: 'Straight-bar dip with band assist',
        cues: ['Touch lower ribs to the bar', 'Flare elbows comfortably back without shoulder pinch']
      },
      {
        level: 3,
        name: 'Banded Muscle-Up Transition Groove',
        focus: 'Grooving the rapid wrist turnover without pausing at the chest',
        prerequisites: 'Level 1 high pull-ups + Level 2 straight bar dips',
        regressions: 'Jumping muscle-ups on low bar',
        cues: ['Keep the bar glued close to chest during turnover', 'Whip head forward as elbows rotate over bar']
      },
      {
        level: 4,
        name: 'Strict Bar Muscle-Up (Zero Kip)',
        focus: 'Full dead-hang execution with simultaneous bilateral turnover',
        prerequisites: 'Smooth banded transitions',
        regressions: 'Light band assist for first rep',
        cues: ['Explosive pull -> rapid simultaneous wrist flip -> crisp vertical pressout']
      }
    ]
  }
];

interface CalisthenicsPageProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const CalisthenicsPage: React.FC<CalisthenicsPageProps> = ({ onOpenAuth }) => {
  const { user, isAuthenticated, isLoading: authLoading, demoLogin } = useAuth();
  const [selectedSkillId, setSelectedSkillId] = useState<string>('muscle-up');
  const [userSkills, setUserSkills] = useState<SkillProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Skill logging form state
  const [logHoldSec, setLogHoldSec] = useState<number>(15);
  const [logReps, setLogReps] = useState<number>(5);
  const [logMilestoneStatus, setLogMilestoneStatus] = useState<'In Training' | 'Mastered'>('In Training');
  const [logNotes, setLogNotes] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Ability & Equipment Calibration State
  const [userPullupMax, setUserPullupMax] = useState<number>(10);
  const [userDipMax, setUserDipMax] = useState<number>(12);
  const [userPushupMax, setUserPushupMax] = useState<number>(25);
  const [userHollowSec, setUserHollowSec] = useState<number>(45);
  const [availableGear, setAvailableGear] = useState<string[]>(['Pull-Up Bar', 'Dip Station']);

  // Load user saved calisthenics skills from backend
  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await api.calisthenics.getSkills();
      if (Array.isArray(res)) {
        setUserSkills(res);
      }
    } catch (err) {
      console.error('Failed to load calisthenics skills:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ensure authentication completes before protected calisthenics requests are issued
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      fetchSkills();
    } else {
      setUserSkills([]);
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const selectedSkill = ALL_SKILLS.find((s) => s.id === selectedSkillId) || ALL_SKILLS[0];
  const userProgressForSkill = userSkills.find(
    (s) => s.skill_name.toLowerCase().includes(selectedSkill.title.toLowerCase()) ||
           selectedSkill.title.toLowerCase().includes(s.skill_name.toLowerCase())
  );

  // Calculate readiness recommendation
  const calculateCalisthenicsReadiness = () => {
    const score = userPullupMax * 3 + userDipMax * 2 + userPushupMax * 0.5 + userHollowSec * 0.8;
    if (score >= 120) return { title: 'Elite Level (Ready for Front Lever & Full Muscle-Up)', badge: 'Tier 4 Advanced' };
    if (score >= 80) return { title: 'Advanced Level (Ready for Strict Dips, HSPU & Tuck Levers)', badge: 'Tier 3 Intermediate+' };
    if (score >= 45) return { title: 'Intermediate Level (Ready for Pull-Up, Dip & L-Sit Progressions)', badge: 'Tier 2 Intermediate' };
    return { title: 'Foundation Level (Build Baseline Push-Up, Scapular Hang & Plank)', badge: 'Tier 1 Foundation' };
  };

  const readiness = calculateCalisthenicsReadiness();

  // Save skill milestone to database
  const handleSaveSkillMilestone = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) {
        onOpenAuth('login');
      } else {
        await demoLogin();
      }
      return;
    }
    setIsSaving(true);
    try {
      const activeLevel = selectedSkill.levels[0];
      await api.calisthenics.logSkill({
        skill_name: selectedSkill.title,
        progression_level: activeLevel.name,
        level_number: activeLevel.level,
        hold_duration_sec: logHoldSec,
        repetitions: logReps,
        milestone_status: logMilestoneStatus,
        notes: logNotes || `Logged milestone for ${selectedSkill.title}`,
      });
      setSaveSuccessMsg(`Milestone saved for ${selectedSkill.title}!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      fetchSkills();
    } catch (err) {
      console.error('Failed to save skill:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16 pt-4">
      {/* Unauthenticated Alert / Callout */}
      {!authLoading && !isAuthenticated && (
        <div className="bg-[#121618] border border-[#3d471d] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(215,255,67,0.06)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#D7FF43]/20 text-[#D7FF43] uppercase tracking-wider">
                Preview Mode
              </span>
              <span className="text-sm font-bold text-white">
                Athlete Profile Required for Progress Tracking
              </span>
            </div>
            <p className="text-xs text-[#88A8C8] mt-1 max-w-2xl leading-relaxed">
              You are viewing the standard 7-skill calisthenics progression tree. Launch One-Click Demo Access or sign in to record hold durations, repetitions, and persist milestone status to your database.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => demoLogin()}
              className="px-4 py-2 rounded-xl bg-[#D7FF43] text-[#080909] font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-[0_0_12px_rgba(215,255,67,0.2)]"
            >
              One-Click Demo Access
            </button>
            <button
              onClick={() => onOpenAuth ? onOpenAuth('login') : demoLogin()}
              className="px-4 py-2 rounded-xl border border-white/20 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222711] border border-[#3d471d] text-xs font-mono font-bold text-[#D7FF43] mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>04 • GYMNASTIC LEVERAGE & CALISTHENICS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Calisthenics Progressions & Skill Tree
          </h1>
          <p className="text-sm text-[#88A8C8] mt-0.5">
            Beginner, intermediate and advanced progressions for push-ups, pull-ups, dips, handstands, L-sits, front levers, and muscle-ups.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#0e1113] border border-[#1a1f24] flex items-center gap-3">
          <Trophy className="w-5 h-5 text-[#D7FF43]" />
          <div>
            <div className="text-[10px] font-mono text-[#88A8C8] uppercase font-bold">Calculated Tier</div>
            <div className="text-xs font-black text-white">{readiness.badge}</div>
          </div>
        </div>
      </div>

      {/* 7 SKILL SELECTOR PILLS */}
      <div className="flex flex-wrap gap-2 border-b border-[#1a1f24] pb-3">
        {ALL_SKILLS.map((skill) => {
          const isSelected = selectedSkillId === skill.id;
          return (
            <button
              key={skill.id}
              onClick={() => setSelectedSkillId(skill.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#222711] text-[#D7FF43] border border-[#3d471d] shadow-[0_0_12px_-2px_rgba(215,255,67,0.3)]'
                  : 'bg-[#0e1113] text-[#88A8C8] border border-[#1a1f24] hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {skill.title}
            </button>
          );
        })}
      </div>

      {/* ACTIVE SKILL OVERVIEW HERO */}
      <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222711] text-[#D7FF43] border border-[#3d471d]">
                {selectedSkill.category}
              </span>
              <span className="text-[10px] font-mono text-[#88A8C8]">Gear: {selectedSkill.equipment}</span>
            </div>
            <h2 className="text-2xl font-black text-white">{selectedSkill.title}</h2>
            <p className="text-xs text-[#88A8C8] mt-1 max-w-2xl leading-relaxed">
              {selectedSkill.description}
            </p>
          </div>

          <div className="text-right sm:self-center font-mono">
            <div className="text-[10px] text-[#88A8C8] uppercase">Target Dose</div>
            <div className="text-xs font-bold text-[#D7FF43]">{selectedSkill.targetVolume}</div>
          </div>
        </div>

        {/* Safety & Prerequisite Disclaimer */}
        <div className="p-3.5 rounded-xl bg-[#121618] border border-[#1e252a] text-xs text-[#88A8C8] flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-[#D7FF43] shrink-0 mt-0.5" />
          <span>
            <strong className="text-white">Safety Science Rule:</strong> Master all prerequisite repetitions and hold times with clean biomechanics before jumping levels. Unsafe progression solely to hit a target increases tendon strain.
          </span>
        </div>
      </div>

      {/* 4 PROGRESSION LEVELS FOR THE SELECTED SKILL */}
      <div className="space-y-4">
        <div className="text-xs font-mono font-bold text-[#88A8C8] uppercase tracking-wider flex items-center justify-between">
          <span>Step-by-Step Levels & Safe Regressions</span>
          <span className="text-[#D7FF43]">Progressive Moment-Arm Scaling</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedSkill.levels.map((step) => (
            <div
              key={step.level}
              className="p-5 rounded-2xl bg-[#0e1113] border border-[#1a1f24] hover:border-[#D7FF43]/40 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#222711] text-[#D7FF43] font-mono text-xs font-bold border border-[#3d471d]">
                  Level {step.level}
                </span>
                <span className="text-[10px] font-mono text-[#88A8C8]">Kinetic Vector</span>
              </div>

              <h3 className="text-base font-bold text-white">{step.name}</h3>
              <p className="text-xs text-[#88A8C8] leading-relaxed">{step.focus}</p>

              <div className="pt-2 border-t border-[#1a1f24] space-y-1.5 text-[11px] font-mono">
                <div>
                  <span className="text-[#88A8C8]">Prerequisites: </span>
                  <strong className="text-white">{step.prerequisites}</strong>
                </div>
                <div>
                  <span className="text-[#88A8C8]">Safe Regression: </span>
                  <strong className="text-amber-400">{step.regressions}</strong>
                </div>
              </div>

              {/* Form Cues */}
              <div className="pt-2">
                <div className="text-[10px] font-mono font-bold text-[#88A8C8] uppercase mb-1">Key Form Cues:</div>
                <ul className="space-y-1">
                  {step.cues.map((cue, i) => (
                    <li key={i} className="text-[11px] text-[#88A8C8] flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#D7FF43]" />
                      {cue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE MILESTONE TRACKER & LOGGER FOR THIS SKILL */}
      <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#3d471d] shadow-[0_0_20px_-5px_rgba(215,255,67,0.15)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1a1f24]">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase tracking-wider">
              PERSISTENT DATABASE TRACKER
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">
              Record Milestone for: {selectedSkill.title}
            </h3>
            <p className="text-xs text-[#88A8C8] mt-1">
              Saves your hold duration, unbroken reps, and mastery status directly to your profile.
            </p>
          </div>

          <button
            onClick={handleSaveSkillMilestone}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(215,255,67,0.25)] disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : (isAuthenticated ? 'Save Skill Record' : 'Sign In to Save')}
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 rounded-xl bg-[#222711] border border-[#3d471d] text-xs font-mono text-[#D7FF43] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {saveSuccessMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
              Hold Duration (seconds)
            </label>
            <input
              type="number"
              value={logHoldSec}
              onChange={(e) => setLogHoldSec(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
              Unbroken Repetitions
            </label>
            <input
              type="number"
              value={logReps}
              onChange={(e) => setLogReps(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
              Milestone Status
            </label>
            <select
              value={logMilestoneStatus}
              onChange={(e) => setLogMilestoneStatus(e.target.value as any)}
              className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
            >
              <option value="In Training">In Training (Working on Form)</option>
              <option value="Mastered">Mastered (Clean Execution)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
              Notes / Technical Cues
            </label>
            <input
              type="text"
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="e.g. Zero kipping, clean false grip"
              className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
