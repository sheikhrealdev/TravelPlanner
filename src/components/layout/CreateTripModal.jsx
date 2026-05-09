import React, { useState, useEffect } from 'react';
import { X, Edit3, Send } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTripStore } from '../../store/tripStore';

const CreateTripModal = ({ isOpen, onClose, editingTrip = null }) => {
  const setActiveTrip = useTripStore((state) => state.setActiveTrip);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    startDate: '', 
    endDate: '' 
  });

  // Sync form data when editing an existing trip
  useEffect(() => {
    if (editingTrip && isOpen) {
      setFormData({ 
        title: editingTrip.title, 
        startDate: editingTrip.start_date, 
        endDate: editingTrip.end_date 
      });
    } else if (!editingTrip && isOpen) {
      setFormData({ title: '', startDate: '', endDate: '' });
    }
  }, [editingTrip, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session found.");

      let response;

      if (editingTrip) {
        // --- UPDATE LOGIC ---
        response = await supabase
          .from('trips')
          .update({
            title: formData.title.toUpperCase(),
            start_date: formData.startDate,
            end_date: formData.endDate
          })
          .eq('id', editingTrip.id)
          .select(); // Crucial to get the updated row back
      } else {
        // --- INSERT LOGIC ---
        response = await supabase
          .from('trips')
          .insert([{
            title: formData.title.toUpperCase(),
            destination: formData.title,
            start_date: formData.startDate,
            end_date: formData.endDate,
            user_id: user.id
          }])
          .select();
      }

      if (response.error) throw response.error;

      // Update the global store with the new/updated data immediately
      if (response.data && response.data[0]) {
        setActiveTrip(response.data[0]);
      }

      onClose();
    } catch (err) {
      console.error("Database Operation Error:", err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
            {editingTrip ? 'Modify Mission' : 'Initialize Mission'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-all hover:text-white"
          >
            <X size={20}/>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mission Codename</label>
            <div className="relative">
              <Edit3 className="absolute left-4 top-3.5 text-slate-600" size={16} />
              <input 
                required 
                type="text" 
                value={formData.title} 
                placeholder="E.G. KYOTO PROTOCOL"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all uppercase font-bold italic"
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Departure</label>
              <input 
                required 
                type="date" 
                value={formData.startDate} 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:border-blue-500 outline-none"
                style={{ colorScheme: 'dark' }}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Extraction</label>
              <input 
                required 
                type="date" 
                value={formData.endDate} 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:border-blue-500 outline-none"
                style={{ colorScheme: 'dark' }}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic tracking-widest py-5 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Synchronizing Data..." : editingTrip ? "Update Mission Details" : "Commence Mission"}
            {!loading && <Send size={16}/>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTripModal;