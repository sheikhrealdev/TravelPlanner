import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTripStore } from '../store/tripStore';
import toast from 'react-hot-toast';
import { ShieldAlert, PhoneCall, Info, Zap, Wind, AlertTriangle, ChevronRight, HeartPulse, ShieldCheck, Edit2, Trash2, Plus, X, Save } from 'lucide-react';

// GLOBAL ETIQUETTE (Updated for worldwide protocol)
const ETIQUETTE = [
  { title: "Currency Tactics", desc: "Always carry small local cash denominations. Many global street vendors do not accept digital pay.", icon: <Zap size={16}/> },
  { title: "Transit Flow", desc: "Observe local escalator rules (stand on one side, walk on the other) and maintain low volume on public transit.", icon: <ChevronRight size={16}/> },
  { title: "Tipping Norms", desc: "Research local tipping etiquette beforehand. It varies wildly from mandatory percentages to culturally offensive.", icon: <ShieldCheck size={16}/> },
  { title: "Cultural Decorum", desc: "Respect local dress codes and photography rules, especially when visiting religious or historical nodes.", icon: <Wind size={16}/> }
];

// Color Themes for dynamic cards
const THEMES = [
  { color: "text-blue-500", border: "border-blue-500/20" },
  { color: "text-red-500", border: "border-red-500/20" },
  { color: "text-emerald-500", border: "border-emerald-500/20" },
  { color: "text-amber-500", border: "border-amber-500/20" },
  { color: "text-purple-500", border: "border-purple-500/20" }
];

export default function SafetyTips() {
  const { activeTrip } = useTripStore();
  const [contacts, setContacts] = useState([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, label: '', number: '' });

  // Fetch Contacts from Database
  useEffect(() => {
    if (activeTrip?.id) {
      fetchContacts();
    }
  }, [activeTrip?.id]);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('trip_id', activeTrip.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setContacts(data);
    }
  };

  // Open Modal for Add/Edit
  const openModal = (contact = null) => {
    if (contact) {
      setEditForm({ id: contact.id, label: contact.label, number: contact.number });
    } else {
      setEditForm({ id: null, label: '', number: '' });
    }
    setIsModalOpen(true);
  };

  // Save or Update Contact
  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeTrip?.id) return toast.error("No active trip selected.");

    const payload = {
      trip_id: activeTrip.id,
      label: editForm.label,
      number: editForm.number
    };

    let result;
    const toastId = toast.loading("Encrypting network node...");

    if (editForm.id) {
      result = await supabase.from('emergency_contacts').update(payload).eq('id', editForm.id);
    } else {
      result = await supabase.from('emergency_contacts').insert([payload]);
    }

    if (!result.error) {
      toast.success("Protocol updated.", { id: toastId });
      fetchContacts();
      setIsModalOpen(false);
    } else {
      toast.error("Sync failed.", { id: toastId });
    }
  };

  // Delete Contact
  const handleDelete = async (e, id) => {
    e.preventDefault(); // Stop link click
    if(window.confirm("Purge this node from the network?")) {
      const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
      if (!error) {
        toast.success("Node purged.");
        fetchContacts();
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 space-y-12">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-l-4 border-blue-600 pl-8">
        <div>
          <h1 className="text-6xl font-black text-blue-600 italic uppercase tracking-tighter leading-none">Protocol</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2">Global Safety & Synchronization</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-full border border-red-900/50">
          <AlertTriangle size={16} className="text-red-700 animate-pulse" />
          <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Emergency Ready</span>
        </div>
      </header>

      {/* DYNAMIC EMERGENCY NUMBERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {contacts.map((num, index) => {
          const theme = THEMES[index % THEMES.length]; // Auto-assign colors
          return (
            <a href={`tel:${num.number.replace(/[^0-9+]/g, '')}`} key={num.id} className={`group bg-slate-950 border ${theme.border} p-8 rounded-[2.5rem] transition-all hover:bg-slate-900/50 shadow-2xl relative overflow-hidden`}>
              
              {/* Action Buttons (Hover Reveal) */}
              <div className="absolute top-5 right-5 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
                <button onClick={(e) => { e.preventDefault(); openModal(num); }} className="p-2.5 bg-slate-900/80 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all backdrop-blur-sm"><Edit2 size={14}/></button>
                <button onClick={(e) => handleDelete(e, num.id)} className="p-2.5 bg-slate-900/80 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all backdrop-blur-sm"><Trash2 size={14}/></button>
              </div>

              <div className="relative z-10">
                <PhoneCall size={24} className={`mb-6 ${theme.color} group-hover:scale-110 transition-transform`} />
                <div className="text-slate-500 text-[10px] uppercase font-black tracking-[0.3em] mb-1">{num.label}</div>
                <div className="text-4xl font-black text-white italic tracking-tighter truncate">{num.number}</div>
              </div>
              <div className={`absolute -right-4 -bottom-4 opacity-5 ${theme.color}`}><PhoneCall size={120} /></div>
            </a>
          );
        })}

        {/* ADD NEW NUMBER BUTTON (Seamless layout integration) */}
        <button onClick={() => openModal()} className="group bg-slate-950/40 border border-dashed border-slate-800 p-8 rounded-[2.5rem] transition-all hover:bg-slate-900/60 hover:border-blue-500/50 shadow-2xl flex flex-col items-center justify-center min-h-[180px]">
          <div className="p-4 bg-slate-900 rounded-2xl group-hover:bg-blue-600 group-hover:text-white text-slate-500 transition-all shadow-inner mb-3">
            <Plus size={24} />
          </div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Add Network Node</span>
        </button>
      </div>

      {/* STATIC PROTOCOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-6">
        {/* LEFT COLUMN: CULTURE SYNC */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-800"></div>
            <h3 className="text-[14px] font-black text-blue-600 uppercase tracking-[0.5em] whitespace-nowrap">Culture Sync</h3>
            <div className="h-px flex-1 bg-slate-800"></div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {ETIQUETTE.map((tip) => (
              <TipCard key={tip.title} title={tip.title} desc={tip.desc} icon={tip.icon} />
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: SAFETY NODES (Global Context) */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-800"></div>
            <h3 className="text-[14px] font-black text-red-600 uppercase tracking-[0.5em] whitespace-nowrap">Safety Nodes</h3>
            <div className="h-px flex-1 bg-slate-800"></div>
          </div>

          <div className="space-y-3">
            {/* HAZARD READINESS */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden">
              <h4 className="text-white font-black italic text-xl uppercase tracking-tighter mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600" /> Local Hazard Alerts
              </h4>
              <div className="space-y-4">
                <div>
                  <span className="text-white uppercase text-[10px] font-black tracking-widest block mb-1">Environmental Awareness</span>
                  <p className="text-slate-600 text-xs font-bold leading-relaxed">Research the region's common natural risks (e.g., earthquakes, hurricanes) and identify structural safe zones.</p>
                </div>
                <div>
                  <span className="text-white uppercase text-[10px] font-black tracking-widest block mb-1">Digital Warnings</span>
                  <p className="text-slate-600 text-xs font-bold leading-relaxed">Always download the official local early-warning or disaster management app upon arrival.</p>
                </div>
              </div>
            </div>

            {/* MEDICAL PROTOCOL */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden">
              <h4 className="text-white font-black italic text-xl uppercase tracking-tighter mb-4 flex items-center gap-2">
                <HeartPulse size={18} className="text-emerald-600" /> Medical Protocol
              </h4>
              <div className="space-y-4">
                <div>
                  <span className="text-white uppercase text-[10px] font-black tracking-widest block mb-1">Embassy Radar</span>
                  <p className="text-slate-600 text-xs font-bold leading-relaxed">Pinpoint the nearest embassy or international clinic that provides services in your native language.</p>
                </div>
                <div>
                  <span className="text-white uppercase text-[10px] font-black tracking-widest block mb-1">Insurance Vault</span>
                  <p className="text-slate-600 text-xs font-bold leading-relaxed">Keep encrypted digital copies of your travel and health insurance in the Secure Vault tab.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECURE MODAL FOR ADD/EDIT (Invisible unless active) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">
              {editForm.id ? "Configure Node" : "Deploy New Node"}
            </h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Entity Label</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Tourist Police"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold text-sm outline-none focus:border-blue-500 transition-all shadow-inner"
                  value={editForm.label}
                  onChange={(e) => setEditForm({...editForm, label: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Frequency (Number)</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. 911"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold text-sm outline-none focus:border-blue-500 transition-all shadow-inner"
                  value={editForm.number}
                  onChange={(e) => setEditForm({...editForm, number: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-black italic uppercase tracking-widest text-xs py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20">
                <Save size={16} /> Update Protocol
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component (Untouched styling)
function TipCard({ title, desc, icon }) {
  return (
    <div className="group bg-slate-950/50 p-6 rounded-3xl border border-slate-900 hover:border-blue-500/30 transition-all flex items-start gap-5">
      <div className="p-3 bg-slate-900 rounded-xl text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-black uppercase text-[13px] tracking-widest mb-1 italic">{title}</h4>
        <p className="text-slate-600 text-xs font-bold leading-relaxed tracking-tight">{desc}</p>
      </div>
    </div>
  );
}