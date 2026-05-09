import React, { useState, useRef, useEffect } from 'react';
import { Plus, Bell, User, Settings, LogOut, Shield, ChevronDown, Calendar, MapPin, Check, Trash2, Edit2, Wallet, FolderLock } from 'lucide-react';
import { useTripStore } from '../../store/tripStore';
import { useProfileStore } from '../../store/profileStore'; // Store import kiya
import { supabase } from '../../supabaseClient';
import CreateTripModal from './CreateTripModal';

const Navbar = () => {
  // --- UI STATES ---
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isTripDropdownOpen, setTripDropdownOpen] = useState(false);
  
  // --- DATA STATES ---
  const [trips, setTrips] = useState([]);
  const [editingTrip, setEditingTrip] = useState(null);
  
  // --- GLOBAL STORES ---
  const { activeTrip, setActiveTrip } = useTripStore(); // Sirf trip ka data yahan se liya
  const { user } = useProfileStore(); // Profile ka data direct Profile Store se liya
  
  // --- REFS FOR CLICK-OUTSIDE ---
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const tripRef = useRef(null);

  // --- FETCH ALL MISSIONS ---
  const fetchTrips = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch Error:", error.message);
    } else if (data) {
      setTrips(data);
      // Sync active trip if data has changed
      if (activeTrip) {
        const current = data.find(t => t.id === activeTrip.id);
        if (current) setActiveTrip(current);
      } else if (data.length > 0 && !activeTrip) {
        setActiveTrip(data[0]);
      }
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [user]); // user dependency rakhi taake login par fetch ho

  // --- MISSION DELETION ---
  const handleDeleteTrip = async (e, id) => {
    e.stopPropagation();
    const confirmed = window.confirm("ABORT MISSION? This will permanently delete all records for this trip.");
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('trips').delete().eq('id', id);
      if (error) throw error;
      
      if (activeTrip?.id === id) setActiveTrip(null);
      fetchTrips();
    } catch (err) {
      alert(`System Error: ${err.message}`);
    }
  };

  // --- MISSION EDIT TRIGGER ---
  const handleEditTrip = (e, trip) => {
    e.stopPropagation();
    setEditingTrip(trip);
    setModalOpen(true);
    setTripDropdownOpen(false);
  };

  // --- LOGOUT SEQUENCE ---
  const handleLogout = async () => {
  try {
    // 1. Supabase se sign out
    await supabase.auth.signOut();

    // 2. 🚨 THE REAL FIX: Browser ki storage completely saaf kar dein
    localStorage.clear(); 
    sessionStorage.clear();
    // 4. Force reload and redirect
    window.location.replace('/'); 
    
  } catch (error) {
    console.error("Logout Error:", error.message);
  }
};

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
      if (tripRef.current && !tripRef.current.contains(event.target)) setTripDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="w-full h-16 min-h-[64px] shrink-0 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 z-50 relative text-white font-sans">
        
        {/* LEFT: MISSION SELECTOR */}
        <div className="relative" ref={tripRef}>
          <button 
            onClick={() => setTripDropdownOpen(!isTripDropdownOpen)}
            className="flex items-center gap-4 hover:bg-slate-800/50 p-2 rounded-xl transition-all group"
          >
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-blue-500" />
                <h1 className="text-sm font-black uppercase italic tracking-wider">
                  {activeTrip?.title || "NO ACTIVE MISSION"}
                </h1>
                <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isTripDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar size={12} className="text-slate-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {activeTrip ? `${activeTrip.start_date} / ${activeTrip.end_date}` : "Standby for deployment"}
                </span>
              </div>
            </div>
          </button>

          {/* MISSION DROPDOWN */}
          {isTripDropdownOpen && (
            <div className="absolute left-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
              <div className="p-3 border-b border-slate-800 bg-slate-950/30">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">All Trips</span>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {trips.length > 0 ? (
                  trips.map((trip) => (
                    <div 
                      key={trip.id}
                      onClick={() => { setActiveTrip(trip); setTripDropdownOpen(false); }}
                      className={`group flex items-center justify-between p-3 rounded-xl transition-all mb-1 cursor-pointer ${activeTrip?.id === trip.id ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-slate-800 border border-transparent'}`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold uppercase italic ${activeTrip?.id === trip.id ? 'text-blue-400' : 'text-slate-200'}`}>
                          {trip.title}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono tracking-tighter">{trip.start_date}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={(e) => handleEditTrip(e, trip)} className="p-1.5 hover:text-blue-400 text-slate-500 transition-colors">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={(e) => handleDeleteTrip(e, trip.id)} className="p-1.5 hover:text-rose-500 text-slate-500 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-[10px] text-slate-500 text-center uppercase font-bold italic tracking-widest">No existing data</p>
                )}
              </div>
              <button 
                onClick={() => { setEditingTrip(null); setModalOpen(true); setTripDropdownOpen(false); }}
                className="w-full p-4 text-[10px] font-black uppercase text-blue-500 hover:bg-blue-500/10 border-t border-slate-800 transition-colors tracking-widest"
              >
                + Initialize New Trip
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: CONTROL CENTER */}
        <div className="flex items-center gap-3">
          
          <button 
            onClick={() => { setEditingTrip(null); setModalOpen(true); }}
            className="hidden lg:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-[11px] font-black uppercase italic tracking-wider">Deploy Trip</span>
          </button>

          <div className="h-6 w-px bg-slate-800 mx-2"></div>

          {/* NOTIFICATION HUB */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => { setNotificationsOpen(!isNotificationsOpen); setProfileOpen(false); }}
              className={`p-2.5 transition-all relative rounded-xl ${isNotificationsOpen ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-150 origin-top-right z-50">
                <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">System_Alerts</span>
                </div>
                <div className="p-8 text-center">
                  <p className="text-[10px] text-slate-600 font-black uppercase italic tracking-widest leading-relaxed">
                    Frequency Clear // All Systems Nominal
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* USER IDENTITY - Connected to Profile Store */}
          <div className="relative ml-2 pl-4 border-l border-slate-800" ref={profileRef}>
            <button 
              onClick={() => { setProfileOpen(!isProfileOpen); setNotificationsOpen(false); }}
              className="flex items-center gap-3 group outline-none"
            >
              <div className="text-right hidden md:block">
                {/* Dynamically showing Profile Name */}
                <p className="text-[11px] font-black text-white italic uppercase tracking-tighter leading-none">
                  {user?.name || "Agent Unknown"}
                </p>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1 opacity-80">Verified Traveler</p>
              </div>
              
              <div className={`h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center overflow-hidden border-2 transition-all duration-300 ${isProfileOpen ? 'border-blue-400 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-transparent shadow-lg'}`}>
                {/* Dynamically showing Profile Pic */}
                {user?.profilePic ? (
                  <img src={user.profilePic} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-black text-white">
                    {user?.name ? user.name.substring(0,2).toUpperCase() : "USR"}
                  </span>
                )}
              </div>
              <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-4 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right z-50">
                <div className="p-4 bg-slate-950/50 border-b border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Authorization</p>
                  <p className="text-sm font-bold text-white italic uppercase">{user?.name || "User Profile"}</p>
                </div>
                
                <div className="p-2">
                  {/* USEFUL COMPONENTS ADDED */}
                  <ProfileItem icon={<User size={14} />} label="My Profile" onClick={() => window.location.href = '/profile'} />
                  <ProfileItem icon={<Wallet size={14} />} label="Finance Hub" onClick={() => window.location.href = '/budget'} />
                  <ProfileItem icon={<FolderLock size={14} />} label="Document Vault" onClick={() => window.location.href = '/vault'} />
                  
                  <div className="h-px bg-slate-800 my-2 mx-2"></div>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors group"
                  >
                    <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    <span className="text-[11px] font-black uppercase italic tracking-wider">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MODAL MOUNTING */}
      <CreateTripModal 
        isOpen={isModalOpen} 
        onClose={() => { setModalOpen(false); setEditingTrip(null); fetchTrips(); }} 
        editingTrip={editingTrip}
      />
    </>
  );
};

// HELPER COMPONENT (Updated with onClick)
const ProfileItem = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all group text-left">
    <span className="text-slate-500 group-hover:text-blue-400 transition-colors">{icon}</span>
    <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
  </button>
);

export default Navbar;