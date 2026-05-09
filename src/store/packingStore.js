import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePackingStore = create(
  persist(
    (set) => ({
      items: [
        { id: 1, text: "Passport", packed: true, category: "Essentials" },
        { id: 2, text: "JR Pass", packed: false, category: "Essentials" },
        { id: 3, text: "Universal Adapter", packed: false, category: "Electronics" },
        { id: 4, text: "Comfortable Walking Shoes", packed: false, category: "Clothing" },
      ],

      // Actions
      addItem: (text, category = "General") => set((state) => ({
        items: [...state.items, { id: Date.now(), text, packed: false, category }]
      })),

      toggleItem: (id) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, packed: !item.packed } : item
        )
      })),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
      })),

      clearPacked: () => set((state) => ({
        items: state.items.filter((item) => !item.packed)
      })),
    }),
    {
      name: 'tokyo-packing-storage',
    }
  )
);