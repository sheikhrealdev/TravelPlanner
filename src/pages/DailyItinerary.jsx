import React from 'react';
import { useTripStore } from '../store/tripStore.js';
import { Check, Clock, MapPin, Navigation2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function DailyItinerary() {
  const { days, toggleComplete, currentDayId, setCurrentDay } = useTripStore();
  
  const activeDay = days?.find(d => d.id === currentDayId) || days?.[0];
  
  const hasActivities = activeDay?.activities?.length > 0;
  const remainingActivities = activeDay?.activities?.filter(act => !act.completed) || [];
  
  // Logic: Agar saari activities tick ho jayen, to day finished hai
  const isDayFinished = hasActivities && remainingActivities.length === 0;

  // --- SYNC HANDLER (ACTIVITY & DAY STATUS) ---
  const handleToggle = async (dayId, activityId) => {
    // 1. Store Update (Local UI foran change ho)
    toggleComplete(dayId, activityId);

    // 2. State se current data nikalna
    const targetDay = days.find(d => d.id === dayId);
    if (!targetDay) return;

    // Activities array update karein
    const updatedActivities = targetDay.activities.map(act => 
      act.id === activityId ? { ...act, completed: !act.completed } : act
    );

    // Check karein ke kya is update ke baad saari activities complete ho gayi hain?
    const allDone = updatedActivities.length > 0 && updatedActivities.every(a => a.completed);

    // 3. Supabase Sync (Activities Array + Day Status)
    try {
      const { error } = await supabase
        .from('itinerary')
        .update({ 
          activities: updatedActivities,
          is_completed: allDone // Day status ko bhi sync kar rahe hain automatically
        })
        .eq('id', dayId);

      if (error) throw error;
    } catch (err) {
      console.error("Transmission Error:", err.message);
    }
  };

  return (
    <div className="h-full bg-transparent text-slate-200 py-10 px-6 max-w-xl mx-auto animate-in fade-in duration-700 overflow-y-auto custom-scrollbar">
      
      {/* HEADER */}
      <header className="mb-6 border-l-4 border-blue-600 pl-6">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-1">
          Operational Timeline
        </p>
        <div className="flex items-baseline gap-4">
          <h1 className="text-5xl font-black text-blue-600 tracking-tighter italic uppercase">
            {activeDay?.date || "No Schedule"}
          </h1>
          {activeDay?.is_completed && (
            <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase italic">Completed</span>
          )}
        </div>
      </header>

      {/* DAY SELECTOR */}
      <div className="flex gap-2 overflow-x-auto pb-8 no-scrollbar items-center border-b border-slate-800/50 mb-10">
        {days?.map((day, index) => (
          <button
            key={day.id}
            onClick={() => setCurrentDay(day.id)}
            className={`shrink-0 px-5 py-3 rounded-2xl transition-all duration-300 group border ${
              currentDayId === day.id
                ? "bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                : "bg-transparent border-transparent hover:bg-slate-800/40"
            }`}
          >
            <div className="flex flex-col items-center">
               <span className={`text-[9px] font-black uppercase tracking-widest mb-1 transition-colors ${
                 currentDayId === day.id ? "text-blue-400" : "text-slate-600 group-hover:text-slate-400"
               }`}>
                 Day
               </span>
               <span className={`text-xl font-black italic transition-colors ${
                 currentDayId === day.id ? "text-blue-500" : "text-slate-700 group-hover:text-slate-500"
               }`}>
                 {index + 1 < 10 ? `0${index + 1}` : index + 1}
               </span>
            </div>
          </button>
        ))}
      </div>

      {/* THE TREE STRUCTURE */}
      <div className="relative">
        {hasActivities && (
          <div className="absolute left-[21px] top-2 bottom-6 w-[1px] bg-gradient-to-b from-blue-600/50 via-slate-800 to-transparent"></div>
        )}

        <div className="space-y-8 pb-20">
          {hasActivities ? (
            <>
              {activeDay.activities.map((act) => (
                <div key={act.id} className="relative flex gap-6 items-center group">
                  
                  {/* TICK BUTTON */}
                  <div className="relative shrink-0">
                    <button 
                      onClick={() => handleToggle(activeDay.id, act.id)}
                      className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 border rotate-45 ${
                        act.completed 
                        ? "bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                        : "bg-slate-950 border-slate-800 hover:border-blue-500 hover:rotate-[135deg]"
                      }`}
                    >
                      <div className="-rotate-45">
                        {act.completed ? (
                          <Check size={18} className="text-white stroke-[3px]" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-blue-400" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* ACTIVITY TAB */}
                  <div className={`flex-1 p-5 rounded-[2rem] border transition-all duration-500 ${
                    act.completed 
                    ? "bg-slate-900/20 border-slate-800/40 opacity-40 grayscale" 
                    : "bg-slate-900 border-slate-800 shadow-2xl hover:border-slate-700"
                  }`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={12} className={act.completed ? "text-slate-600" : "text-blue-500 animate-pulse"} />
                        <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${act.completed ? "text-slate-700" : "text-slate-500"}`}>
                          {act.time || "FLEX TIME"}
                        </span>
                      </div>
                      
                      <h3 className={`text-xl font-black italic tracking-tight leading-tight uppercase ${
                        act.completed ? "text-slate-500 line-through decoration-2" : "text-white"
                      }`}>
                        {act.title}
                      </h3>

                      <div className="flex items-center gap-4 mt-3">
                        <button className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-400 transition-colors">
                          <Navigation2 size={10} fill="currentColor" /> Route
                        </button>
                        <button className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-400 transition-colors">
                          <MapPin size={10} /> Intel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* OBJECTIVE COMPLETE MESSAGE */}
              {isDayFinished && (
                <div className="pt-6 pl-16 animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="flex items-center gap-4 py-4 px-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.3em]">
                      Objective : All Activities Completed
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 border border-dashed border-slate-800 rounded-[2.5rem] bg-slate-900/20">
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Sector Data Empty</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      `}</style>
    </div>
  );
}