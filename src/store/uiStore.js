import { create } from 'zustand';

export const useVaultStore = create((set) => ({
  documents: [
    { id: 1, name: 'JR Pass Confirmation', type: 'PDF', category: 'Transport' },
    { id: 2, name: 'Hotel Sunroute Shinjuku', type: 'PNG', category: 'Lodging' },
  ],
  addDocument: (doc) => set((state) => ({ 
    documents: [...state.documents, { ...doc, id: Date.now() }] 
  })),
  removeDocument: (id) => set((state) => ({ 
    documents: state.documents.filter(d => d.id !== id) 
  })),
}));