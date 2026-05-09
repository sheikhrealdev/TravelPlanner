import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  GripVertical, 
  CalendarDays, 
  Wallet, 
  Backpack, 
  ShieldCheck, 
  Users, 
  UserCircle, 
  Lock,
  Info,
  X 
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  // { name: 'Explore', href: '/explore', icon: Compass },
  { name: 'Trip Builder', href: '/builder', icon: GripVertical },
  { name: 'Itinerary', href: '/itinerary', icon: CalendarDays },
  { name: 'Budget', href: '/budget', icon: Wallet },
  { name: 'Packing', href: '/packing', icon: Backpack },
  { name: 'Vault', href: '/vault', icon: Lock },
  { name: 'Community', href: '/community', icon: Users },
  { name: 'Profile', href: '/profile', icon: UserCircle },
  { name: 'Safety', href: '/safety', icon: ShieldCheck },
];

export const Sidebar = ({ className }) => {
  const [showSystemInfo, setShowSystemInfo] = useState(false);

  return (
    <aside className={cn(
      "w-64 bg-slate-900 h-screen flex flex-col border-r border-slate-800 relative",
      className
    )}>
      {/* Logo Section */}
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-tight italic">
          TRAVEL<span className="text-blue-500">PLANNER</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
          WORLD EXPLORER DRIFT
        </p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => 
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )
            }
          >
            <item.icon size={18} className={cn(
              "transition-colors",
              "group-hover:text-blue-400"
            )} />
            <span className="text-sm font-bold uppercase tracking-tight italic">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer/User Mini-Profile */}
      <div className="p-4 border-t border-slate-800 relative">
        
        {/* SYSTEM INFO POPUP (THE LITTLE WINDOW) */}
        {showSystemInfo && (
          <div className="absolute bottom-full left-4 right-4 mb-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Info size={14} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">System Diagnostics</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSystemInfo(false);
                }} 
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                <span className="text-[9px] font-black text-slate-500 uppercase">Version</span>
                <span className="text-[10px] text-slate-200 font-black italic">3.0.4-STABLE</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                <span className="text-[9px] font-black text-slate-500 uppercase">Developer</span>
                <span className="text-[10px] text-slate-200 font-black italic tracking-tighter">S. M. Hassan</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                <span className="text-[9px] font-black text-slate-500 uppercase">Studio</span>
                <span className="text-[10px] text-slate-200 font-black italic">RedHat</span>
              </div>
              <div className="pt-1">
                <p className="text-[9px] text-slate-400 font-bold leading-tight uppercase tracking-tighter italic">
                  
                  TripPlanner_Core Engine Active
                </p>
                <p className="text-[9px] text-blue-500/60 font-black uppercase tracking-tighter mt-1">
                  All systems operational
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE TOGGLE BUTTON */}
        <button 
          onClick={() => setShowSystemInfo(!showSystemInfo)} 
          className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-800/50 rounded-2xl transition-all duration-300 text-left group border border-transparent hover:border-slate-700"
        >
          {/* LOGO ICON */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shrink-0 flex items-center justify-center border border-white/10 shadow-lg group-hover:shadow-blue-500/30 transition-all">
            <Compass size={18} className="text-white" />
          </div>

          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-black text-slate-200 truncate italic uppercase tracking-tighter">Traveler Planner</span>
            <span className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-widest">By RedHat</span>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;