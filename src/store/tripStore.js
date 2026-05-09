import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";
import { get, set, del } from "idb-keyval";
import { supabase } from "../supabaseClient";

// Custom storage connector for IndexedDB
const idbStorage = {
  getItem: async (name) => (await get(name)) || null,
  setItem: async (name, value) => await set(name, value),
  removeItem: async (name) => await del(name),
};

export const useTripStore = create(
  persist(
    (set, get) => ({
      // --- GLOBAL STATE ---
      activeTrip: null,

      // --- ITINERARY STATE ---
      days: [], 
      currentDayId: null,

      // --- OTHER MODULES ---
      packingList: [],
      selectedCity: null,
      totalBudget: 0,
      selectedDistricts: [],

      // --- DB SYNC HELPER ---
      _syncItineraryToDB: async (dayId, activities) => {
        if (typeof dayId === 'string' && dayId.startsWith('temp')) return;
        const { error } = await supabase
          .from('itinerary')
          .update({ activities })
          .eq('id', dayId);
        if (error) console.error("DB Sync Error:", error.message);
      },

      // --- MISSION (TRIP) ACTIONS ---
      setActiveTrip: (trip) => set({ activeTrip: trip }),
      setCity: (city) => set({ selectedCity: city }),

      // --- ITINERARY & DAY ACTIONS ---
      setDays: (newDays) => set({ days: newDays }),
      setCurrentDay: (id) => set({ currentDayId: id }),
      
      updateDayName: async (dayId, newName) => {
        set((state) => ({
          days: state.days.map((day) =>
            day.id === dayId ? { ...day, date: newName } : day
          ),
        }));
        const { error } = await supabase
          .from('itinerary')
          .update({ day_title: newName })
          .eq('id', dayId);
        if (error) console.error("Day Name Sync Error:", error.message);
      },

      addDay: (dbDay) => set((state) => ({
        days: [
          ...state.days,
          {
            id: dbDay.id,
            date: dbDay.day_title,
            activities: dbDay.activities || [],
          },
        ],
      })),

      removeDay: async (dayId) => {
        set((state) => ({
          days: state.days.length > 1 ? state.days.filter((d) => d.id !== dayId) : state.days,
        }));
        const { error } = await supabase
          .from('itinerary')
          .delete()
          .eq('id', dayId);
        if (error) console.error("Day Delete Sync Error:", error.message);
      },

      // --- ACTIVITY ACTIONS ---
      updateActivity: async (dayId, activityId, updatedData) => {
        const state = get();
        const updatedDays = state.days.map((day) =>
          day.id === dayId
            ? {
                ...day,
                activities: day.activities.map((act) =>
                  act.id === activityId ? { ...act, ...updatedData } : act
                ),
              }
            : day
        );
        set({ days: updatedDays });
        const targetDay = updatedDays.find(d => d.id === dayId);
        await state._syncItineraryToDB(dayId, targetDay.activities);
      },

      addActivity: async (dayId, activity) => {
        const state = get();
        const newActivity = { 
          ...activity, 
          id: crypto.randomUUID(), 
          completed: false 
        };
        const updatedDays = state.days.map((day) =>
          day.id === dayId
            ? { ...day, activities: [...day.activities, newActivity] }
            : day
        );
        set({ days: updatedDays });
        const targetDay = updatedDays.find(d => d.id === dayId);
        if (targetDay) await state._syncItineraryToDB(dayId, targetDay.activities);
      },

      toggleComplete: async (dayId, activityId) => {
        const state = get();
        const updatedDays = state.days.map((day) =>
          day.id === dayId
            ? {
                ...day,
                activities: day.activities.map((act) =>
                  act.id === activityId ? { ...act, completed: !act.completed } : act
                ),
              }
            : day
        );
        set({ days: updatedDays });
        const targetDay = updatedDays.find(d => d.id === dayId);
        await state._syncItineraryToDB(dayId, targetDay.activities);
      },

      removeActivity: async (dayId, activityId) => {
        const state = get();
        const updatedDays = state.days.map((day) =>
          day.id === dayId
            ? { ...day, activities: day.activities.filter((a) => a.id !== activityId) }
            : day
        );
        set({ days: updatedDays });
        const targetDay = updatedDays.find(d => d.id === dayId);
        await state._syncItineraryToDB(dayId, targetDay.activities);
      },

      // --- PACKING LIST ACTIONS ---
      setPackingList: (items) => set({ packingList: items }),
      addPackingItem: (item) => set((state) => ({ packingList: [...state.packingList, item] })),
      togglePackingItem: (itemId) => set((state) => ({
        packingList: state.packingList.map((item) =>
          item.id === itemId ? { ...item, is_packed: !item.is_packed } : item
        ),
      })),
      removePackingItem: (itemId) => set((state) => ({
        packingList: state.packingList.filter((item) => item.id !== itemId),
      })),
      updatePackingItem: (itemId, newName) => set((state) => ({
        packingList: state.packingList.map((item) =>
          item.id === itemId ? { ...item, item_name: newName } : item
        ),
      })),

      // --- SELECTION & DND LOGIC ---
      toggleDistrict: (district) => set((state) => ({
        selectedDistricts: state.selectedDistricts.some((d) => d.id === district.id)
          ? state.selectedDistricts.filter((d) => d.id !== district.id)
          : [...state.selectedDistricts, district],
      })),

      handleDragUpdate: async (active, over) => {
        const state = get();
        const activeId = active.id;
        const overId = over.id;
        const activeDay = state.days.find((day) => day.activities.some((a) => a.id === activeId));
        const overDay = state.days.find((day) => day.id === overId || day.activities.some((a) => a.id === overId));
        if (!activeDay || !overDay) return;

        let finalDays = [...state.days];
        if (activeDay.id === overDay.id) {
          const oldIdx = activeDay.activities.findIndex((a) => a.id === activeId);
          const newIdx = activeDay.activities.findIndex((a) => a.id === overId);
          const newActivities = arrayMove(activeDay.activities, oldIdx, newIdx);
          finalDays = state.days.map((d) => d.id === activeDay.id ? { ...d, activities: newActivities } : d);
          set({ days: finalDays });
          await state._syncItineraryToDB(activeDay.id, newActivities);
        } else {
          const activityToMove = activeDay.activities.find((a) => a.id === activeId);
          finalDays = state.days.map((day) => {
            if (day.id === activeDay.id) return { ...day, activities: day.activities.filter((a) => a.id !== activeId) };
            if (day.id === overDay.id) return { ...day, activities: [...day.activities, activityToMove] };
            return day;
          });
          set({ days: finalDays });
          const dayA = finalDays.find((d) => d.id === activeDay.id);
          const dayO = finalDays.find((d) => d.id === overDay.id);
          await state._syncItineraryToDB(activeDay.id, dayA.activities);
          await state._syncItineraryToDB(overDay.id, dayO.activities);
        }
      },
    }),
    {
      name: "tokyo-trip-large-storage",
      storage: createJSONStorage(() => idbStorage),
    }
  )
);