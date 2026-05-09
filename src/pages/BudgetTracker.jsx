import React, { useState, useEffect } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { useTripStore } from '../store/tripStore';
import { Wallet, PieChart, Plus, X, Trash2, Edit3, Save, Settings2, Globe } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function BudgetTracker() {
  const { 
    expenses, baseCurrency, foreignCurrency, manualRate, rateDirection,
    addExpense, removeExpense, updateExpense, setExpenses, updateSettings 
  } = useBudgetStore();
  const { activeTrip } = useTripStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [tempSettings, setTempSettings] = useState({ 
    base: baseCurrency, foreign: foreignCurrency, rate: manualRate, direction: rateDirection 
  });
  const [newExp, setNewExp] = useState({ description: '', amount: '', category: 'Food' });
  const [editForm, setEditForm] = useState({ description: '', amount: '', category: '' });

  // Sync tempSettings with store when store changes
  useEffect(() => {
    setTempSettings({ base: baseCurrency, foreign: foreignCurrency, rate: manualRate, direction: rateDirection });
  }, [baseCurrency, foreignCurrency, manualRate, rateDirection]);

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!activeTrip?.id) return;
      const { data } = await supabase.from('expenses').select('*').eq('trip_id', activeTrip.id).order('created_at', { ascending: false });
      if (data) setExpenses(data);
    };
    fetchExpenses();
  }, [activeTrip?.id, setExpenses]);

  const totalBase = expenses.reduce((sum, exp) => sum + Number(exp.base_amount), 0);
  const totalForeign = expenses.reduce((sum, exp) => sum + Number(exp.foreign_amount), 0);

  const categories = [
    { name: 'Transport', color: 'bg-blue-500' }, 
    { name: 'Lodging', color: 'bg-indigo-500' }, 
    { name: 'Food', color: 'bg-emerald-500' }, 
    { name: 'Activities', color: 'bg-rose-500' }, 
    { name: 'Shopping', color: 'bg-amber-500' }, 
    { name: 'Other', color: 'bg-slate-500' }
  ];

  const handleStartEdit = (exp) => {
    setEditingId(exp.id);
    setEditForm({ description: exp.description, amount: exp.foreign_amount, category: exp.category });
  };

  const handleSaveEdit = async (id) => {
    await updateExpense(id, editForm);
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-6 pt-10 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-l-4 border-blue-600 pl-8">
        <div>
          <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">Financial Hub</p>
          <h1 className="text-5xl font-black text-blue-600 italic uppercase tracking-tighter">Finance</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsSettingsOpen(true)} className="p-4 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl hover:text-blue-500 transition-all"><Settings2 size={20}/></button>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs flex items-center gap-3"><Plus size={18} strokeWidth={3}/> Record</button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl">
          <p className="text-blue-500 font-black uppercase text-[10px] mb-6 tracking-widest flex items-center gap-2"><Wallet size={14}/> Capital Total ({baseCurrency})</p>
          <div className="text-5xl font-black text-white italic tracking-tighter">{totalBase.toLocaleString(undefined, {maximumFractionDigits: 0})} {baseCurrency}</div>
          <p className="text-xs font-bold text-slate-500 mt-4 uppercase">≈ {totalForeign.toLocaleString(undefined, {maximumFractionDigits: 0})} {foreignCurrency}</p>
        </div>

        <div className="md:col-span-2 p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col justify-center">
          <p className="text-slate-500 font-black uppercase text-[10px] mb-8 tracking-widest flex justify-between items-center italic">Sector Distribution <PieChart size={14} className="text-blue-500"/></p>
          <div className="h-4 w-full bg-slate-950 rounded-full flex overflow-hidden ring-4 ring-slate-900/50">
            {categories.map(cat => {
              const amt = expenses.filter(e => e.category === cat.name).reduce((s, e) => s + Number(e.base_amount), 0);
              const width = (amt / (totalBase || 1)) * 100;
              return width > 0 ? <div key={cat.name} className={`${cat.color} h-full transition-all duration-700`} style={{ width: `${width}%` }} /> : null;
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-8">
            {categories.map(cat => <div key={cat.name} className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400"><div className={`w-2 h-2 rounded-full ${cat.color}`}/> {cat.name}</div>)}
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
              <th className="p-6 pl-10">Description</th>
              <th className="p-6">Classification</th>
              <th className="p-6 text-right pr-4">Value ({foreignCurrency})</th>
              <th className="p-6 text-right pr-10">Total ({baseCurrency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {expenses.map((exp) => (
              <tr key={exp.id} className="group hover:bg-slate-800/40 transition-all">
                <td className="p-6 pl-10 font-black italic uppercase text-white">
                  {editingId === exp.id ? <input className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-white w-full outline-none focus:border-blue-500" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})}/> : exp.description}
                </td>
                <td className="p-6">
                  {editingId === exp.id ? 
                    <select className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[10px] font-black text-blue-500 outline-none" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                      {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    : <span className="px-3 py-1 bg-slate-950 text-slate-500 text-[9px] font-black rounded-md border border-slate-800 uppercase">{exp.category}</span>
                  }
                </td>
                <td className="p-6 text-right font-bold italic text-slate-400 pr-4">
                  {editingId === exp.id ? <input type="number" className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right w-24 outline-none text-blue-500" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})}/> : Number(exp.foreign_amount).toLocaleString()}
                </td>
                <td className="p-6 text-right pr-10">
                  <div className="flex items-center justify-end gap-4 font-black italic text-xl text-white group-hover:text-blue-500 transition-all">
                    {Number(exp.base_amount).toLocaleString(undefined, {maximumFractionDigits: 1})}
                    <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingId === exp.id ? 
                        <button onClick={() => handleSaveEdit(exp.id)} className="text-emerald-500 p-2"><Save size={18}/></button> 
                        : <>
                            <button onClick={() => handleStartEdit(exp)} className="text-slate-600 hover:text-blue-400 p-2"><Edit3 size={16}/></button>
                            <button onClick={() => removeExpense(exp.id)} className="text-slate-600 hover:text-rose-500 p-2"><Trash2 size={16}/></button>
                          </>
                      }
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SETTINGS MODAL - FIXED BLUR HEIGHT */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl " onClick={() => setIsSettingsOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-white italic uppercase flex items-center gap-3"><Globe className="text-blue-500" size={24}/> Setup</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Home</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white uppercase font-bold outline-none focus:border-blue-500" value={tempSettings.base} onChange={e => setTempSettings({...tempSettings, base: e.target.value.toUpperCase()})} /></div>
              <div><label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Trip</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white uppercase font-bold outline-none focus:border-blue-500" value={tempSettings.foreign} onChange={e => setTempSettings({...tempSettings, foreign: e.target.value.toUpperCase()})} /></div>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex flex-col gap-2">
                <button onClick={() => setTempSettings({...tempSettings, direction: 'baseToForeign'})} className={`p-2.5 rounded-xl border text-[9px] font-black uppercase transition-all ${tempSettings.direction === 'baseToForeign' ? 'bg-blue-600 border-blue-400 text-white' : 'border-slate-800 text-slate-500'}`}>1 {tempSettings.base} = X {tempSettings.foreign}</button>
                <button onClick={() => setTempSettings({...tempSettings, direction: 'foreignToBase'})} className={`p-2.5 rounded-xl border text-[9px] font-black uppercase transition-all ${tempSettings.direction === 'foreignToBase' ? 'bg-blue-600 border-blue-400 text-white' : 'border-slate-800 text-slate-500'}`}>1 {tempSettings.foreign} = X {tempSettings.base}</button>
              </div>
              <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-black text-center text-xl outline-none focus:border-blue-500" value={tempSettings.rate} onChange={e => setTempSettings({...tempSettings, rate: e.target.value})} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsSettingsOpen(false)} className="flex-1 py-4 text-slate-500 font-bold uppercase text-[10px]">Abort</button>
              <button onClick={() => updateSettings(activeTrip.id, tempSettings).then(() => setIsSettingsOpen(false))} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl uppercase text-[10px] italic shadow-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD MODAL - FIXED BLUR HEIGHT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl " onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.3em]">Entry Protocol</p>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">New Entry</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); await addExpense(activeTrip.id, newExp); setIsModalOpen(false); setNewExp({description:'', amount:'', category:'Food'}); }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Asset Description</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold italic outline-none focus:border-blue-500 shadow-inner" value={newExp.description} onChange={e => setNewExp({...newExp, description: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Amount ({foreignCurrency})</label>
                  <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold italic outline-none focus:border-blue-500 shadow-inner" value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Sector</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none cursor-pointer" value={newExp.category} onChange={e => setNewExp({...newExp, category: e.target.value})}>
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic py-5 rounded-2xl shadow-xl shadow-blue-900/30 transition-all mt-4">Add Expense</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}