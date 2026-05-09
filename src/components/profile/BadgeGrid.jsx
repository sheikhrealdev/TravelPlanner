import React from 'react';
import { Map, Zap, ShieldCheck, Star } from 'lucide-react';

const BadgeCard = ({ unlocked, title, desc, icon }) => (
  <div className={`p-6 rounded-[2rem] border transition-all ${
    unlocked 
      ? 'bg-slate-900 border-slate-800 hover:border-blue-500/50' 
      : 'bg-slate-950 border-slate-900 opacity-40 grayscale'
  }`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
      unlocked ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-800 text-slate-600'
    }`}>
      {icon}
    </div>
    <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
    <p className="text-slate-500 text-[10px] leading-tight">{desc}</p>
  </div>
);

export const BadgeGrid = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <BadgeCard 
        unlocked={stats.totalStops > 0} 
        title="First Step" 
        desc="Add your first activity" 
        icon={<Map size={24} />}
      />
      <BadgeCard 
        unlocked={stats.totalSpent > 1000} 
        title="Big Spender" 
        desc="Plan a $1000+ budget" 
        icon={<Zap size={24} />}
      />
      <BadgeCard 
        unlocked={stats.daysCount >= 3} 
        title="Weekend Warrior" 
        desc="Plan at least 3 days" 
        icon={<ShieldCheck size={24} />}
      />
      <BadgeCard 
        unlocked={false} 
        title="Master Guide" 
        desc="Complete all 10 pages" 
        icon={<Star size={24} />}
      />
    </div>
  );
};