import React from 'react';
import { Activity, ShieldAlert, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-zinc-950/80 mt-20 py-12 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xl font-black tracking-wider text-white">KRIDA</span>
            </div>
            <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
              Your AI-Powered Personal Fitness & Sports Coach. Blending peer-reviewed sports physiology,
              Retrieval-Augmented Generation (RAG), and adaptive progressive overload tracking.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-400">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              College Generative AI & Sports Science Capstone
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Core Modules</h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-emerald-400 transition-colors">Adaptive Workout Splits</li>
              <li className="hover:text-emerald-400 transition-colors">Sports Science RAG Engine</li>
              <li className="hover:text-emerald-400 transition-colors">HYROX & Calisthenics Modes</li>
              <li className="hover:text-emerald-400 transition-colors">Progressive Overload Analytics</li>
              <li className="hover:text-emerald-400 transition-colors">Autonomic Recovery Scoring</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Scientific Pillars</h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-emerald-400 transition-colors">Schoenfeld Hypertrophy Models</li>
              <li className="hover:text-emerald-400 transition-colors">80/20 Polarized Endurance</li>
              <li className="hover:text-emerald-400 transition-colors">Epley / Brzycki 1RM Estimations</li>
              <li className="hover:text-emerald-400 transition-colors">Mifflin-St Jeor TDEE Synthesis</li>
            </ul>
          </div>
        </div>

        {/* Safety & Medical Disclaimer */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Disclaimer:</strong> KRIDA provides general fitness, athletic training, and sports nutrition guidance based on computational models. It is not a substitute for professional medical advice, clinical diagnosis, or treatment.
            </span>
          </div>
          <div className="text-xs text-zinc-400 shrink-0">
            © {new Date().getFullYear()} KRIDA Technologies. Production Ready.
          </div>
        </div>
      </div>
    </footer>
  );
};
