import React, { useEffect } from 'react';
import { useTripStore } from '../store/tripStore';
import { useBudgetStore } from '../store/budgetStore';
import { useDocumentStore } from '../store/documentStore';
import { 
  Clock, Wallet, FileText, MapPin, Calendar, 
  ArrowRight, CheckCircle2, Cpu, Info, X, ShieldCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomeSearch() {
    
  // Store Subscriptions
  const { activeTrip, days, selectedCity, currentDayId } = useTripStore(); 
  // 🚨 Yahan baseCurrency import ki hai taake symbol/currency theek aaye 🚨
  const { expenses, fetchExpenses, baseCurrency } = useBudgetStore(); 
  const { documents, fetchDocuments } = useDocumentStore();

  // Dynamic Data Fetching
  useEffect(() => {
    const loadDashboardData = async () => {
      if (activeTrip?.id) {
        if (fetchDocuments) await fetchDocuments(activeTrip.id);
        if (fetchExpenses) await fetchExpenses(activeTrip.id);
      }
    };
    loadDashboardData();
  }, [activeTrip?.id, fetchDocuments, fetchExpenses]);

  // Safe calculations
  const totalActivities = days?.reduce((acc, day) => acc + (day.activities?.length || 0), 0) || 0;
  
  // 🚨 Budget Calculation: Ab 'base_amount' calculate hoga jo DB mein save hota hai 🚨
  const totalSpent = expenses?.reduce((acc, exp) => acc + (Number(exp.base_amount) || 0), 0) || 0;

  // Logic for Dynamic Itinerary Filtering
  const activeDay = days?.find(d => d.id === currentDayId) || days?.[0];
  const remainingActivities = activeDay?.activities?.filter(act => !act.completed) || [];
  const isDayFullyCompleted = activeDay?.activities?.length > 0 && remainingActivities.length === 0;

  const nextActivity = remainingActivities.length > 0 
    ? remainingActivities[0] 
    : { 
        title: activeDay?.activities?.length > 0 ? "All activities completed" : "No schedule", 
        time: "--:--" 
      };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">

      {/* HERO SECTION */}
      <div className="relative p-10 rounded-[3rem] bg-gradient-to-br from-blue-600 to-indigo-900 overflow-hidden shadow-2xl border border-white/10">
        <div className="relative z-10">
          <h1 className="text-5xl font-black text-white mb-3 italic tracking-tighter uppercase leading-none">
            Hello, Explorer! 
          </h1>
          <p className="text-blue-100 opacity-90 max-w-md font-bold uppercase tracking-widest text-[12px] mt-4">
            {activeTrip?.destination || 'DESTINATION'} ADVENTURE IN PROGRESS.
          </p>

          <Link
            to="/itinerary"
            className="inline-flex items-center gap-2 mt-8 bg-white text-blue-900 px-6 py-3 rounded-2xl font-black uppercase italic text-xs tracking-tighter hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1"
          >
            Go to Itinerary <ArrowRight size={16} />
          </Link>
        </div>

        <div className="absolute right-[-40px] top-[-40px] opacity-10 rotate-12 text-white">
          <Calendar size={280} />
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<MapPin size={20} className="text-emerald-400" />}
          label="Activities"
          value={totalActivities}
          unit="Objective Stops"
        />
        <StatCard
          icon={<Wallet size={20} className="text-amber-400" />}
          label="Budget"
          // Yahan exact Home Currency aur total kharcha map kiya gaya hai
          value={`${totalSpent.toLocaleString()} ${baseCurrency || '$'}`}
          unit="Current Expenses"
        />
        <StatCard
          icon={<FileText size={20} className="text-purple-400" />}
          label="Vault"
          value={documents?.length || 0}
          unit="Stored Documents"
        />
        <StatCard
          icon={<Clock size={20} className="text-rose-400" />}
          label="Next Target"
          value={nextActivity.time}
          unit={nextActivity.title}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* TODAY'S PLAN */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col h-[330px]">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
              Plan: {activeDay?.date || activeDay?.name || 'Syncing...'}
            </h3>
            <Link to="/itinerary" className="text-blue-500 text-[12px] font-black uppercase tracking-[0.2em] hover:underline">
              Full Schedule
            </Link>
          </div>

          <div className="flex-grow overflow-hidden">
            {isDayFullyCompleted ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 py-8 px-10 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] text-center">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                  <p className="text-emerald-500 text-xs font-black uppercase tracking-[0.4em]">
                    Objective : All Activities Completed
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto pr-4 custom-scrollbar space-y-4">
                {activeDay?.activities?.length ? (
                  activeDay.activities.map((act) => (
                    <div
                      key={act.id}
                      className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
                        act.completed 
                        ? "bg-slate-950 border-slate-900 opacity-40" 
                        : "bg-slate-800/40 border-slate-700/50 hover:border-blue-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl ${
                          act.completed ? "text-slate-600 bg-slate-900" : "text-blue-400 bg-blue-500/10"
                        }`}>
                          {act.time}
                        </span>
                        <span className={`${act.completed ? "text-slate-600 line-through" : "text-white"} font-bold text-lg italic uppercase`}>
                          {act.title}
                        </span>
                      </div>
                      {act.completed && <CheckCircle2 size={22} className="text-blue-600" />}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-30">
                    <Calendar size={48} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Sector Data</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="space-y-4">
          <QuickLink to="/vault" label="Access Travel Vault" color="bg-emerald-500"/>
          <QuickLink to="/budget" label="Currency & Budget" color="bg-amber-500"/>
          <QuickLink to="/packing" label="Packing Checklist" color="bg-indigo-500"/>
          <QuickLink to="/builder" label="Trip Planner" color="bg-red-500"/>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-7 rounded-[2.5rem] hover:border-blue-500/30 transition-all group shadow-xl">
      <div className="p-3 bg-slate-800 w-fit rounded-2xl mb-4 group-hover:bg-blue-600/10 transition-colors">{icon}</div>
      <div className="text-3xl font-black text-white tracking-tighter italic leading-none mb-2">{value}</div>
      <div className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">{label}</div>
      <div className="text-slate-600 text-[10px] mt-2 font-bold uppercase truncate">{unit}</div>
    </div>
  );
}

function QuickLink({ to, label, color }) {
  return (
    <Link to={to} className="flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-[1.8rem] hover:bg-slate-800/80 hover:border-slate-700 transition-all group">
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${color} shadow-[0_0_12px_currentColor]`} />
        <span className="text-white text-xs font-black uppercase italic tracking-tight">{label}</span>
      </div>
      <ArrowRight size={18} className="text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}