import { create } from 'zustand';
import { supabase, RATE_LIMIT_CONFIG } from '../supabaseClient';

export const useProfileStore = create((set, get) => ({
  user: null,
  loading: false,

  // FETCH PROFILE
  fetchProfile: async (userId) => {
    if (!userId) return;

    try {
      // 1. Rate Limiting Check (10 profile fetches per minute kafi hain)
      const { data: isLimited } = await supabase.rpc('is_rate_limited', { 
  uid: userId, 
  limit_count: RATE_LIMIT_CONFIG.fetch.count, // 👈 Ab ye hamesha 50 uthayega
  seconds_frame: RATE_LIMIT_CONFIG.fetch.frame 
});

      if (isLimited) {
        console.warn("Profile Sync: Rate limit hit. Using cached data.");
        return; 
      }

      // --- 2. Aapka Original Logic ---
      set({ loading: true });

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        set({
          user: {
            id: data.id,
            name: data.full_name,
            profilePic: data.avatar_url,
            home_location: data.home_location,
            bio: data.bio,
            preferred_currency: data.preferred_currency
          }
        });
      }

      if (error) {
        console.error("Fetch Profile Error:", error);
      }
    } catch (err) {
      console.error("Profile System Error:", err.message);
    } finally {
      set({ loading: false });
    }
  },

  // UPDATE PROFILE
  updateProfile: async (updates) => {
    const { user } = get();

    if (!user?.id) {
      return {
        success: false,
        error: "No User ID"
      };
    }

    // Map frontend keys → database columns
    const payload = {
      full_name: updates.name ?? user.name,
      avatar_url: updates.profilePic ?? user.profilePic,
      home_location: updates.home_location ?? user.home_location,
      bio: updates.bio ?? user.bio,
      preferred_currency:
        updates.preferred_currency ?? user.preferred_currency
    };

    // UPSERT = INSERT OR UPDATE
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...payload
      });

    if (!error) {
      set({
        user: {
          ...user,
          ...updates
        }
      });

      return { success: true };
    }

    console.error("Supabase Update Error:", error);

    return {
      success: false,
      error
    };
  },

  // UPLOAD AVATAR
  uploadAvatar: async (file) => {
    let userId = get().user?.id;

    // fallback session
    if (!userId) {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      userId = session?.user?.id;
    }

    if (!userId) {
      alert("Session Expired. Please login again.");

      return {
        success: false
      };
    }

    const fileExt = file.name.split('.').pop();

    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const filePath = fileName;

    // 1. Upload Image
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload Error:", uploadError);

      alert("Upload Failed: " + uploadError.message);

      return {
        success: false,
        error: uploadError
      };
    }

    // 2. Get Public URL
    const {
      data: { publicUrl }
    } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // 3. Save URL in DB
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        avatar_url: publicUrl
      });

    if (!dbError) {
      // Update local state
      set((state) => ({
        user: {
          ...state.user,
          id: userId,
          profilePic: publicUrl
        }
      }));

      return {
        success: true,
        url: publicUrl
      };
    }

    console.error("Profile Update Error:", dbError);

    return {
      success: false,
      error: dbError
    };
  }
}));