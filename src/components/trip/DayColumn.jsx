import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ItineraryItem } from './ItineraryItem'; // Ensure this is a named import
import { useTripStore } from '../../store/tripStore';
import { Trash2, Edit2, Check, X } from 'lucide-react';

export const DayColumn = ({ day }) => {
  const { setNodeRef } = useDroppable({ id: day.id });
  const { removeDay, updateDayName } = useTripStore();
  
  // Local state for editing day name
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(day.date);

  const handleSaveName = () => {
    if (newName.trim() !== "") {
      updateDayName(day.id, newName);
    } else {
      setNewName(day.date);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNewName(day.date);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col w-80 min-w-[320px] bg-slate-900/40 rounded-[2.5rem] p-6 m-2 border-2 border-slate-800/80 hover:border-blue-500/30 transition-colors h-[410px] shadow-2xl shadow-black/20">
      
      {/* HEADER SECTION */}
      <div className="mb-4 flex justify-between items-start">
        <div className="flex-1 mr-2">
          {isEditing ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <input 
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancel();
                }}
                className="bg-slate-800 border border-blue-500 text-white text-sm font-bold p-1 px-2 rounded-lg w-full outline-none shadow-[0_0_10px_rgba(59,130,246,0.2)]"
              />
              <button onClick={handleSaveName} className="text-emerald-500 hover:scale-110 transition-transform">
                <Check size={16} />
              </button>
              <button onClick={handleCancel} className="text-slate-500 hover:text-red-400">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div 
              className="group/title flex items-center gap-2 cursor-pointer" 
              onClick={() => setIsEditing(true)}
            >
              <h3 className="text-lg font-bold text-white uppercase tracking-wider truncate max-w-[180px] italic">
                {day.date}
              </h3>
              <Edit2 size={12} className="text-slate-600 opacity-0 group-hover/title:opacity-100 transition-opacity" />
            </div>
          )}
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">
            {day.activities.length} Objectives Loaded
          </p>
        </div>
        
        <button 
          onClick={() => {
            if(window.confirm("Purge all data for this operational day?")) removeDay(day.id);
          }}
          className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* ACTIVITY SCROLL AREA */}
      <div 
        ref={setNodeRef} 
        className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1"
      >
        <SortableContext 
          items={day.activities.map(a => a.id)} 
          strategy={verticalListSortingStrategy}
        >
          {day.activities.map((activity) => (
            <ItineraryItem 
              key={activity.id} 
              activity={activity} 
              dayId={day.id} 
            />
          ))}
          
          {day.activities.length === 0 && (
            <div className="h-32 border-2 border-dashed border-slate-800/50 rounded-[2rem] flex flex-col items-center justify-center p-8 text-slate-700 text-[10px] text-center font-black uppercase tracking-[0.3em] bg-slate-900/20 mt-2">
              <span>No Active</span>
              <span>Directives</span>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};