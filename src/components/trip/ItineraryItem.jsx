import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit3, Check } from 'lucide-react';
import { useTripStore } from '../../store/tripStore';

export const ItineraryItem = ({ activity, dayId }) => {
  if (!activity) return null;

  // CHANGE 1: Use updateActivity (the name we used in the store)
  const { removeActivity, updateActivity } = useTripStore();
  const [isEditing, setIsEditing] = useState(false);
  
  const [tempData, setTempData] = useState({
    title: activity.title || "",
    time: activity.time || ""
  });

  useEffect(() => {
    setTempData({ 
      title: activity.title || "", 
      time: activity.time || "" 
    });
  }, [activity.title, activity.time]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id });

  const handleSave = () => {
    if (tempData.title.trim()) {
      // CHANGE 2: Call updateActivity
      updateActivity(dayId, activity.id, { 
        title: tempData.title, 
        time: tempData.time 
      });
    }
    setIsEditing(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-slate-800 border border-slate-700 p-4 rounded-xl mb-3 flex items-center gap-3 group">
      <button {...attributes} {...listeners} className="text-slate-600 cursor-grab active:cursor-grabbing">
        <GripVertical size={18} />
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <input 
              autoFocus
              className="w-full bg-slate-900 border-b border-blue-500 text-sm text-white outline-none px-1 py-0.5"
              value={tempData.title}
              onChange={(e) => setTempData({ ...tempData, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <input 
              className="w-20 bg-slate-900 border-b border-slate-600 text-[10px] text-slate-400 outline-none px-1 uppercase"
              value={tempData.time}
              onChange={(e) => setTempData({ ...tempData, time: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. 09:00 AM"
            />
          </div>
        ) : (
          <>
            <h4 className="text-white font-medium text-sm truncate uppercase tracking-tight">
              {activity.title}
            </h4>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {activity.time}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
        >
          {isEditing ? <Check size={14} className="text-emerald-500" /> : <Edit3 size={14} />}
        </button>
        <button 
          onClick={() => removeActivity(dayId, activity.id)}
          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default ItineraryItem;