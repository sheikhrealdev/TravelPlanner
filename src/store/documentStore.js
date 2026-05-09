import { create } from 'zustand';
import { supabase, RATE_LIMIT_CONFIG } from '../supabaseClient';
import toast from 'react-hot-toast';

export const useDocumentStore = create((set, get) => ({
  documents: [],
  loading: false,

  // --- FETCH DOCUMENTS ---
  fetchDocuments: async (tripId) => {
    if (!tripId) return;

    try {
      // 1. Current user check for rate limiting
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. Database guard call (15 requests per 60 seconds)
        const { data: isLimited } = await supabase.rpc('is_rate_limited', { 
  uid: user.id, 
  limit_count: RATE_LIMIT_CONFIG.fetch.count, // 👈 Ab ye hamesha 50 uthayega
  seconds_frame: RATE_LIMIT_CONFIG.fetch.frame 
});

        if (isLimited) {
          console.warn("Vault Access: Rate limit hit.");
          // Aap chahen to yahan toast.error bhi dikha sakte hain
          return; 
        }
      }

      // --- Aapka Purana Logic ---
      set({ loading: true });

      const { data, error } = await supabase
        .from('document_vault')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const uiDocs = data.map(dbDoc => ({
          id: dbDoc.id,
          name: dbDoc.file_name,
          url: dbDoc.file_url,
          category: dbDoc.category,
          storage_path: dbDoc.storage_path,
          size: 'Secure File'
        }));
        set({ documents: uiDocs });
      } else {
        console.error("Fetch Docs Error:", error);
      }
    } catch (err) {
      console.error("Vault System Error:", err.message);
    } finally {
      set({ loading: false });
    }
  },

  // --- UPLOAD WITH 5MB LIMIT ---
  uploadDocument: async (tripId, file, category) => {
    if (!tripId || !file) return { success: false, error: "Missing data" };

    const MAX_FILE_SIZE = 5 * 1024 * 1024; 
    if (file.size > MAX_FILE_SIZE) {
      toast.error("SECURITY ALERT: File size exceeds the 5MB limit.");
      return { success: false, error: "File exceeds 5MB limit." };
    }

    set({ loading: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, ''); 
    const storagePath = `trip_${tripId}/${Date.now()}_${safeName}`;

    // 1. Storage Upload
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file);

    if (uploadError) {
      toast.error("Storage Error: " + uploadError.message);
      set({ loading: false });
      return { success: false, error: uploadError };
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    // 3. Database Insert
    const newDoc = {
      trip_id: parseInt(tripId), // Database compatibility
      file_name: file.name,
      file_url: publicUrl,
      category: category || 'Other',
      storage_path: storagePath
    };

    const { data: dbData, error: dbError } = await supabase
      .from('document_vault')
      .insert([newDoc])
      .select();

    if (dbError) {
      console.error("DB Insert Error:", dbError);
      toast.error("Database sync failed.");
      set({ loading: false });
      return { success: false, error: dbError };
    }

    if (dbData) {
      const addedDoc = {
        id: dbData[0].id,
        name: dbData[0].file_name,
        url: dbData[0].file_url,
        category: dbData[0].category,
        storage_path: dbData[0].storage_path,
        size: (file.size / 1024).toFixed(1) + ' KB'
      };
      set((state) => ({ documents: [addedDoc, ...state.documents] }));
    }

    set({ loading: false });
    return { success: true };
  },

  // --- UPDATE METADATA ---
  updateDocument: async (docId, updates) => {
    const { error } = await supabase
      .from('document_vault')
      .update({
        file_name: updates.name,
        category: updates.category
      })
      .eq('id', docId);

    if (!error) {
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === docId ? { ...doc, name: updates.name, category: updates.category } : doc
        )
      }));
      return { success: true };
    }
    return { success: false, error };
  },

  
  // --- DELETE DOCUMENT (DB + BUCKET) ---
  deleteDocument: async (docId, storagePath) => {
    try {
      // 1. Pehle Storage Bucket se file udayein
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([storagePath]);

        if (storageError) {
          console.error("Storage Deletion Error:", storageError.message);
          toast.error("File storage purge failed.");
          // Agar file delete nahi hui toh hum ruk jayenge taake DB sync rahe
          return { success: false };
        }
      }

      // 2. Ab Database se record delete karein
      const { error: dbError } = await supabase
        .from('document_vault')
        .delete()
        .eq('id', docId);

      if (dbError) {
        console.error("DB Delete Error:", dbError.message);
        toast.error("Database record removal failed.");
        return { success: false };
      }

      // 3. UI State update karein
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== docId)
      }));

      return { success: true };
    } catch (error) {
      console.error("Critical Deletion Error:", error);
      return { success: false };
    }
  }
}));