import React, { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useTripStore } from "../store/tripStore";
import { DayColumn } from "../components/trip/DayColumn";
import { AddActivityModal } from "../components/trip/AddActivityModal";
import { Plus, CalendarPlus, AlertTriangle, Loader2 } from "lucide-react";
import { supabase, RATE_LIMIT_CONFIG } from '../supabaseClient';

export default function TripBuilder() {
  // --- STORE DATA ---
  const { 
    days, 
    handleDragUpdate, 
    addActivity, 
    addDay, 
    activeTrip, 
    setDays 
  } = useTripStore();

  // --- LOCAL UI STATE ---
  const [activeId, setActiveId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetDay, setTargetDay] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- SENSORS FOR DND ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- FETCH ITINERARY ON TRIP SWITCH ---
  useEffect(() => {
  const fetchItinerary = async () => {
    if (!activeTrip?.id) return;

    try {
      // 1. Rate Limiting Check
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: isLimited } = await supabase.rpc('is_rate_limited', { 
  uid: user.id, 
  limit_count: RATE_LIMIT_CONFIG.fetch.count, // 👈 Ab ye hamesha 50 uthayega
  seconds_frame: RATE_LIMIT_CONFIG.fetch.frame 
});

        if (isLimited) {
          console.warn("Itinerary Sync: Rate limit hit.");
          return; 
        }
      }

      // --- Aapka Original Logic ---
      // 🚨 Sabse pehle purana data saaf karein taake naya load ho
      setDays([]); 
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('itinerary') 
        .select('*')
        .eq('trip_id', activeTrip.id)
        .order('day_number', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedDays = data.map(d => ({
          id: d.id,
          date: d.day_title,
          activities: d.activities || []
        }));
        setDays(formattedDays);
      } else {
        // Default fallback
        setDays([{ id: Date.now(), date: "Day 1", activities: [] }]);
      }
    } catch (err) {
      console.error("Itinerary Fetch Error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  fetchItinerary();
}, [activeTrip?.id]);

  // --- DURATION CALCULATION ---
  const allowedDaysCount = useMemo(() => {
    if (!activeTrip?.start_date || !activeTrip?.end_date) return 0;
    const start = new Date(activeTrip.start_date);
    const end = new Date(activeTrip.end_date);
    const diffInMs = Math.abs(end - start);
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;
  }, [activeTrip]);

  const isExceedingDuration = allowedDaysCount > 0 && days.length > allowedDaysCount;

  // --- HANDLERS ---
  const handleAddDay = async () => {
  if (!activeTrip?.id) return alert("Select a mission first!");
  
  const nextDayNum = days.length + 1;
  const nextDayTitle = `Day ${nextDayNum}`;

  try {
    const { data, error } = await supabase
      .from('itinerary')
      .insert([{
        trip_id: activeTrip.id,
        day_number: nextDayNum,
        day_title: nextDayTitle,
        activities: [],
        is_completed: false
      }])
      .select(); // Ye database se real data (with BigInt ID) wapas layega

    if (error) throw error;
    
    if (data && data[0]) {
      addDay(data[0]); // Ab hum store ko real ID bhej rahe hain
    }
  } catch (err) {
    alert("Deployment Error: " + err.message);
  }
};

  const openModal = (dayId) => {
    setTargetDay(dayId);
    setIsModalOpen(true);
  };

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      return;
    }
    handleDragUpdate(active, over);
    setActiveId(null);
    // Note: DND sync logic hum store.js mein handles karenge
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <Loader2 className="text-blue-500 animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950 p-6">
      {/* HEADER SECTION - NO VERTICAL SCROLL */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-l-4 border-blue-700 pl-8 mb-6 shrink-0">
        <div>
          <h1 className="text-5xl font-black text-blue-600 italic uppercase tracking-tighter leading-none">
            {activeTrip?.title || "MISSION PLANNER"}
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2">
            Sequential Deployment Strategy
          </p>
        </div>

        {isExceedingDuration && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/40 px-4 py-2 rounded-xl">
            <AlertTriangle className="text-amber-500" size={18} />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Temporal Breach</span>
              <span className="text-[9px] text-amber-200 font-bold italic mt-1">
                Day {days.length} exceeds {allowedDaysCount} Day limit.
              </span>
            </div>
          </div>
        )}
      </header>

      {/* HORIZONTAL DRAGGABLE AREA */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <div className="flex gap-6 h-full items-start pb-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {days.map((day) => (
              <div key={day.id} className="flex flex-col min-w-[320px] max-w-[320px] h-full">
                {/* Scrollable Column Content */}
                <DayColumn day={day} />
                
                {/* Fixed Button at Bottom of Column */}
                <button
                  onClick={() => openModal(day.id)}
                  className="mt-4 shrink-0 flex items-center justify-center gap-2 w-full py-3.5 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group bg-slate-900/20"
                >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-xs font-black uppercase tracking-widest">Assign Activity</span>
                </button>
              </div>
            ))}

            {/* ADD DAY BUTTON - SYNCED HEIGHT */}
            <button
              onClick={handleAddDay}
              className={`shrink-0 m-2 min-w-[320px] h-[485px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all duration-500 group ${
                isExceedingDuration 
                ? "border-amber-900/30 text-amber-700 bg-amber-500/5" 
                : "border-slate-800 text-slate-600 hover:border-blue-500/50 hover:bg-blue-500/5"
              }`}
            >
              <div className="p-5 bg-slate-900 rounded-full shadow-2xl transition-all group-hover:scale-110 border border-slate-800">
                <CalendarPlus size={32} />
              </div>
              <div className="text-center">
                <span className="block font-black text-xs uppercase tracking-widest">Initialize Next Day</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter opacity-60">Strategic Extension</span>
              </div>
            </button>

            <DragOverlay>
              {activeId ? (
                <div className="bg-blue-600 p-6 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] text-white rotate-2 border border-blue-400 scale-105">
                  <p className="font-black text-xs uppercase italic">Unit Deployment In Progress...</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <AddActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addActivity}
        dayId={targetDay}
      />
    </div>
  );
}