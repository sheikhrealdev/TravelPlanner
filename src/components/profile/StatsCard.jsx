import React from 'react';

// components/profile/StatsCard.jsx
export function StatsCard({ icon, label, value, suffix }) {
  return (
    <div className="p-8 bg-slate-900 border border-slate-900 rounded-[2.5rem] shadow-xl hover:border-blue-500/30 transition-all group">
      <div className="flex items-center gap-3 text-slate-500 mb-6 font-black uppercase tracking-[0.3em] text-[9px]">
        <div className="p-2 bg-slate-900 rounded-lg group-hover:text-white transition-colors">{icon}</div>
        {label}
      </div>
      <div className="flex items-end gap-2">
        <div className="text-5xl font-black text-white tracking-tighter italic">{value}</div>
        <div className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">{suffix}</div>
      </div>
    </div>
  );
}