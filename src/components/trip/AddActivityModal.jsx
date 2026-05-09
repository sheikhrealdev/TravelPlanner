import React, { useState } from 'react';
import { X, MapPin, Clock } from 'lucide-react';
import { supabase } from '../../supabaseClient'; // Path check kar lena
import { useTripStore } from '../../store/tripStore';

export const AddActivityModal = ({ isOpen, onClose, onAdd, dayId }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00 AM');
  const [loading, setLoading] = useState(false);
  const { days } = useTripStore(); // Store se current days nikalne ke liye

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);

    // 1. Nayi activity ka object
    const newActivity = {
      id: crypto.randomUUID(),
      title,
      time,
      completed: false
    };

    try {
      // 2. Database Sync Logic
      // Pehle is day ki purani activities nikalain
      const currentDay = days.find(d => d.id === dayId);
      const updatedActivities = [...(currentDay?.activities || []), newActivity];

      // 3. Supabase Update
      const { error } = await supabase
        .from('itinerary')
        .update({ activities: updatedActivities })
        .eq('id', dayId); // dayId humari database ki bigint ID hai

      if (error) throw error;

      // 4. Local UI Update
      onAdd(dayId, newActivity);
      
      setTitle('');
      onClose();
    } catch (err) {
      alert("Error saving activity: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">
            Assign Unit to {dayId}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Objective</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-slate-600" size={18} />
              <input 
                autoFocus
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Shibuya Crossing"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 text-slate-600" size={18} />
              <input 
                type="text" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all uppercase italic tracking-widest disabled:opacity-50"
          >
            {loading ? "Synchronizing..." : "Confirm Deployment"}
          </button>
        </form>
      </div>
    </div>
  );
};