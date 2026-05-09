import React, { useState , useEffect } from 'react';
import { useTripStore } from '../store/tripStore.js';
import { Check, Plus, Trash2, Edit3, Package, Save, X, Loader2 } from 'lucide-react';
import { supabase, RATE_LIMIT_CONFIG } from '../supabaseClient';

export default function PackingPage() {
  const { 
    packingList, 
    addPackingItem, 
    togglePackingItem, 
    removePackingItem, 
    updatePackingItem,
    activeTrip 
  } = useTripStore();

  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  
useEffect(() => {
  const fetchPackingList = async () => {
    if (!activeTrip?.id) return;

    try {
      // 1. Current user ki ID lena rate limiting check karne ke liye
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. Database guard call (20 requests per minute for packing list)
        const { data: isLimited } = await supabase.rpc('is_rate_limited', { 
  uid: user.id, 
  limit_count: RATE_LIMIT_CONFIG.fetch.count, // 👈 Ab ye hamesha 50 uthayega
  seconds_frame: RATE_LIMIT_CONFIG.fetch.frame 
});

        if (isLimited) {
          console.warn("Packing List: Sync frequency limit reached.");
          return; // Yahin ruk jayega, fetch nahi karega
        }
      }

      // --- 3. Aapka Original Fetch Logic ---
      const { data, error } = await supabase
        .from('packing_list')
        .select('*')
        .eq('trip_id', activeTrip.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        // Store mein naya data set kar rahe hain
        useTripStore.setState({ packingList: data }); 
      } else if (error) {
        console.error("Fetch Packing Error:", error.message);
      }
    } catch (err) {
      console.error("Packing System Error:", err.message);
    }
  };

  fetchPackingList();
}, [activeTrip?.id]);

  // --- ADD ITEM ---
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeTrip?.id) return;
    const itemName = newItemName.trim();
    setNewItemName('');
    setIsAdding(true);

    const { data, error } = await supabase
      .from('packing_list')
      .insert([{ trip_id: activeTrip.id, item_name: itemName, is_packed: false }])
      .select();

    if (!error && data) addPackingItem(data[0]);
    setIsAdding(false);
  };

  // --- TOGGLE ---
  const onToggle = async (item) => {
    togglePackingItem(item.id);
    const { error } = await supabase
      .from('packing_list')
      .update({ is_packed: !item.is_packed })
      .eq('id', item.id);
    if (error) togglePackingItem(item.id);
  };

  // --- DELETE ---
  const onDelete = async (id) => {
    removePackingItem(id);
    await supabase.from('packing_list').delete().eq('id', id);
  };

  // --- UPDATE ---
  const handleUpdate = async (id) => {
    const originalValue = packingList.find(i => i.id === id)?.item_name;
    updatePackingItem(id, editValue.trim());
    setEditingId(null);
    const { error } = await supabase
      .from('packing_list')
      .update({ item_name: editValue.trim() })
      .eq('id', id);
    if (error) updatePackingItem(id, originalValue);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 min-h-full">
      <header className="mb-12 border-l-4 border-blue-600 pl-6">
        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Logistics</p>
        <h1 className="text-5xl font-black text-blue-600 italic uppercase tracking-tighter">Packing List</h1>
      </header>

      <form onSubmit={handleAdd} className="mb-10 flex gap-3">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="New equipment..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500 transition-all"
        />
        <button disabled={isAdding || !newItemName.trim()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-2xl transition-all flex items-center justify-center disabled:opacity-50">
          {isAdding ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} strokeWidth={3} />}
        </button>
      </form>

      <div className="space-y-3">
        {packingList?.map((item) => (
          <div key={item.id} className={`group flex items-center gap-4 p-5 rounded-[1.5rem] border transition-all duration-500 ${item.is_packed ? "bg-slate-900/10 border-slate-900/50" : "bg-slate-900 border-slate-800 shadow-xl"}`}>
            <button onClick={() => onToggle(item)} className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${item.is_packed ? "bg-blue-600 border-blue-600 scale-110" : "border-slate-700 hover:border-blue-500"}`}>
              {item.is_packed && <Check size={14} className="text-white stroke-[4px]" />}
            </button>

            <div className="flex-1 min-w-0">
              {editingId === item.id ? (
                <input
                  autoFocus
                  className="w-full bg-transparent border-b-2 border-blue-500 text-white font-bold outline-none"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdate(item.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
              ) : (
                <span className={`text-lg font-bold truncate block transition-all duration-500 ${item.is_packed ? "text-slate-600 line-through opacity-50" : "text-slate-200"}`}>
                  {item.item_name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {editingId === item.id ? (
                /* Save aur Cancel Buttons yahan wapas aa gaye hain */
                <div className="flex items-center gap-1">
                  <button onClick={() => handleUpdate(item.id)} className="p-2 text-emerald-500 hover:scale-110 transition-transform">
                    <Save size={20} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingId(item.id); setEditValue(item.item_name); }} className="p-2 text-slate-500 hover:text-blue-400">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="p-2 text-slate-500 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}