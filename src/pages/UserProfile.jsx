import React, { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { useProfileStore } from '../store/profileStore';
import { useTripStore } from '../store/tripStore';
import { useBudgetStore } from '../store/budgetStore';
import { supabase } from '../supabaseClient';

import {
  ShieldCheck,
  MapPin,
  Globe,
  Calendar,
  Clock,
  Briefcase, // 🚨 Naya icon Gear/Packing ke liye
  Camera,
  Edit2,
  Check,
  User,
  X
} from 'lucide-react';

import { StatsCard } from '../components/profile/StatsCard';

export default function UserProfile() {
  const {
    user,
    updateProfile,
    uploadAvatar,
    loading,
    fetchProfile
  } = useProfileStore();

  // 🚨 Purane days aur documents hata diye, ab sirf activeTrip le rahe hain
  const { activeTrip } = useTripStore();
  const { baseCurrency } = useBudgetStore();

  // Local States for Editing
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    home_location: "",
    preferred_currency: baseCurrency
  });

  // 🚨 Nayi State Stats ke liye (Vault hat gaya, Gear aagaya)
  const [tripStats, setTripStats] = useState({
    waypoints: 0,
    daysCount: 0,
    gearCount: 0 
  });

  // States for Cropping
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const fileInputRef = useRef(null);

  // FETCH PROFILE ON LOAD
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        await fetchProfile(session.user.id);
      }
    };

    loadProfile();
  }, [fetchProfile]);

  // Sync internal state with store
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        home_location: user.home_location || "",
        preferred_currency: user.preferred_currency || baseCurrency
      });
    }
  }, [user, baseCurrency]);

  // 🚨 LIVE TRIP STATS FETCH LOGIC
  useEffect(() => {
    const fetchTripStats = async () => {
      if (!activeTrip?.id) return;

      try {
        // A) Itinerary (Days aur Waypoints) ka data
        const { data: itineraryData } = await supabase
          .from('itinerary')
          .select('activities')
          .eq('trip_id', activeTrip.id);

        let totalWaypoints = 0;
        let totalDays = itineraryData?.length || 0;

        if (itineraryData) {
          itineraryData.forEach(day => {
            totalWaypoints += day.activities?.length || 0;
          });
        }

        // B) Packing List (Gear) ka data
        const { count: packingCount } = await supabase
          .from('packing_list')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', activeTrip.id);

        setTripStats({
          waypoints: totalWaypoints,
          daysCount: totalDays,
          gearCount: packingCount || 0
        });

      } catch (error) {
        console.error("Failed to fetch profile stats:", error);
      }
    };

    fetchTripStats();
  }, [activeTrip?.id]);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handlePicSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();

      reader.readAsDataURL(e.target.files[0]);

      reader.onload = () => {
        setImage(reader.result);
        setShowCropper(true);
      };
    }
  };

  const createCroppedImage = async () => {
    try {
      const canvas = document.createElement('canvas');
      const img = new Image();

      img.src = image;

      await new Promise((res) => (img.onload = res));

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.toBlob(async (blob) => {
        const file = new File([blob], "profile.jpg", {
          type: "image/jpeg"
        });

        const result = await uploadAvatar(file);

        if (result.success) {
          setShowCropper(false);
          setImage(null);
        }
      }, 'image/jpeg');

    } catch (e) {
      console.error(e);
    }
  };

  // SAVE PROFILE
  const handleSaveProfile = async () => {
    const result = await updateProfile({
      name: formData.name,
      bio: formData.bio,
      home_location: formData.home_location,
      preferred_currency: formData.preferred_currency
    });

    if (result.success) {
      setIsEditing(false);
    } else {
      console.error(result.error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col gap-6 animate-in fade-in duration-700 p-6 pb-4">

      {/* CROP MODAL */}
      {showCropper && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <div className="relative w-full max-w-md h-96 bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          <div className="mt-8 flex gap-4 w-full max-w-md">
            <button
              onClick={() => {
                setShowCropper(false);
                setImage(null);
              }}
              className="flex-1 py-4 bg-slate-900 text-slate-400 font-black uppercase rounded-2xl border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={createCroppedImage}
              className="flex-1 py-4 bg-blue-600 text-white font-black uppercase rounded-2xl shadow-xl shadow-blue-900/40 hover:bg-blue-500 transition-colors"
            >
              Set Profile
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-l-4 border-blue-600 pl-6 shrink-0">
        <div>
          <h1 className="text-5xl font-black text-blue-600 italic uppercase tracking-tighter leading-none">
            Traveler ID
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[9px] mt-2">
            Personal Identification & Records
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-slate-400/10 rounded-full border border-blue-500/20">
          <ShieldCheck size={16} className="text-blue-600" />
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            Active System User
          </span>
        </div>
      </header>

      {/* IDENTITY BOX (Fills remaining space) */}
      <div className="relative p-8 rounded-[2.5rem] bg-slate-950 border border-slate-900 shadow-2xl overflow-hidden flex-1 flex flex-col justify-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">

          {/* Avatar */}
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={() => fileInputRef.current.click()}
          >
            <div className="w-32 h-32 rounded-full bg-slate-900 border-2 border-blue-600 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(37,99,235,0.2)]">
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={48} className="text-slate-700" />
              )}
            </div>

            <div className="absolute inset-0 bg-blue-600/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={28} className="text-white" />
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePicSelect}
            />
          </div>

          {/* INFO */}
          <div className="flex-1 w-full space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-full">
                {isEditing ? (
                  <input
                    className="bg-slate-900 border-b-2 border-blue-600 text-3xl font-black text-white italic uppercase tracking-tighter outline-none w-full pb-1"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value
                      })
                    }
                  />
                ) : (
                  <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                    {user?.name || "Traveler"}
                  </h2>
                )}
              </div>

              <button
                onClick={() =>
                  isEditing
                    ? handleSaveProfile()
                    : setIsEditing(true)
                }
                className="p-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl transition-all ml-4"
              >
                {isEditing ? <Check size={18} /> : <Edit2 size={18} />}
              </button>
            </div>

            {/* BIO */}
            <div className="space-y-3">
              {isEditing ? (
                <textarea
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-300 font-bold outline-none focus:border-blue-500 h-20 resize-none custom-scrollbar"
                  placeholder="Tell us about your travels..."
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bio: e.target.value
                    })
                  }
                />
              ) : (
                <p className="text-slate-400 font-medium leading-relaxed max-w-2xl italic text-sm line-clamp-2">
                  {user?.bio || "No bio established."}
                </p>
              )}

              {/* DETAILS */}
              <div className="flex flex-wrap gap-5 pt-1">
                {/* LOCATION */}
                <div className="flex items-center gap-2 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                  <MapPin size={14} className="text-blue-500" />
                  {isEditing ? (
                    <input
                      className="bg-slate-900 border-b border-slate-700 outline-none w-24"
                      value={formData.home_location}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          home_location: e.target.value
                        })
                      }
                      placeholder="Home Base"
                    />
                  ) : (
                    <span>
                      Home: {user?.home_location || "Not Set"}
                    </span>
                  )}
                </div>

                {/* CURRENCY */}
                <div className="flex items-center gap-2 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                  <Globe size={14} className="text-emerald-500" />
                  {isEditing ? (
                    <input
                      className="bg-slate-900 border-b border-slate-700 outline-none w-20"
                      value={formData.preferred_currency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferred_currency: e.target.value
                        })
                      }
                      placeholder="Currency"
                    />
                  ) : (
                    <span>
                      Currency: {user?.preferred_currency || "USD"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS (Vault removed, Gear added, Live DB stats mapped) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <StatsCard
          icon={<Clock className="text-blue-500" />}
          label="Waypoints"
          value={tripStats.waypoints}
          suffix="Stops"
        />
        <StatsCard
          icon={<Calendar className="text-purple-500" />}
          label="Duration"
          value={tripStats.daysCount}
          suffix="Days"
        />
        <StatsCard
          icon={<Briefcase className="text-amber-500" />}
          label="Gear"
          value={tripStats.gearCount}
          suffix="Items"
        />
      </div>

      {/* FOOTER */}
      <div className="flex justify-center shrink-0">
        <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.6em]">
          TRAVELER ID VERIFIED || ALL DATA SECURELY SYNCED
        </p>
      </div>
    </div>
  );
}