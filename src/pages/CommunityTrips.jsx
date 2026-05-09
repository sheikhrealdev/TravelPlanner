import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MapPin, Search, Filter } from 'lucide-react';

const SHARED_TRIPS = [
  {
    id: 1,
    user: "Alex Traveler",
    title: "7 Days of Cyberpunk Tokyo",
    location: "Akihabara & Shinjuku",
    category: "Cyberpunk",
    likes: 1240,
    liked: false,
    image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 2,
    user: "Sakura Planner",
    title: "Traditional Kyoto & Tokyo Mix",
    location: "Asakusa & Gion",
    category: "Traditional",
    likes: 850,
    liked: false,
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 3,
    user: "FoodieKen",
    title: "The Ultimate Ramen Map",
    location: "All Districts",
    category: "Food",
    likes: 2100,
    liked: true,
    image: "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 4,
    user: "NeonGhost",
    title: "Shibuya Night Photography",
    location: "Shibuya Crossing",
    category: "Cyberpunk",
    likes: 3420,
    liked: false,
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 5,
    user: "ZenMaster",
    title: "Hidden Gardens & Tea Houses",
    location: "Rikugien & Hamarikyu",
    category: "Traditional",
    likes: 915,
    liked: false,
    image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 6,
    user: "StreetBites",
    title: "Tsukiji Fish Market Tour",
    location: "Tsukiji Outer Market",
    category: "Food",
    likes: 1840,
    liked: false,
    image: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 7,
    user: "UrbanExplorer",
    title: "Architecture of Omotesando",
    location: "Aoyama District",
    category: "Cyberpunk",
    likes: 620,
    liked: false,
    image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 8,
    user: "MatchaLover",
    title: "Uji Tea Ceremony Escape",
    location: "Uji & Nara",
    category: "Traditional",
    likes: 1100,
    liked: false,
    image: "https://images.unsplash.com/photo-1515696955266-4f67e13219e8?auto=format&fit=crop&q=80&w=800"
  }
];

export default function CommunityTrips() {
  const [trips, setTrips] = useState(SHARED_TRIPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = ['All', 'Cyberpunk', 'Traditional', 'Food'];

  const handleLike = (tripId) => {
    setTrips(prev => prev.map(trip => {
      if (trip.id === tripId) {
        return {
          ...trip,
          liked: !trip.liked,
          likes: trip.liked ? trip.likes - 1 : trip.likes + 1
        };
      }
      return trip;
    }));
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         trip.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || trip.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-6">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-l-4 border-blue-600 pl-8">
        <div>
          <h1 className="text-6xl font-black text-blue-600 italic uppercase tracking-tighter leading-none">
            Social Hub
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2">
            Shared Intelligence from the Community
          </p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="FIND JOURNEYS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-black text-white outline-none focus:border-blue-500 transition-all uppercase tracking-widest shadow-xl"
          />
        </div>
      </header>

      {/* FILTER TABS */}
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`shrink-0 px-8 py-3 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest border ${
              activeFilter === cat 
              ? "bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-900/30" 
              : "bg-slate-900/40 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* TRIP GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredTrips.map((trip) => (
          <div 
            key={trip.id} 
            className="group bg-slate-950 border border-slate-900 rounded-[3rem] overflow-hidden hover:border-blue-500/30 transition-all duration-500 shadow-2xl hover:-translate-y-3"
          >
            <div className="relative h-72 overflow-hidden">
              <img src={trip.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90" />
              <div className="absolute top-6 left-6 px-4 py-1.5 bg-blue-600/90 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest">
                {trip.category}
              </div>
              <div className="absolute bottom-6 left-6 flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest italic">
                <MapPin size={14} className="text-blue-500" /> {trip.location}
              </div>
            </div>

            <div className="p-8 space-y-4">
              <div>
                <h3 className="text-2xl font-black text-white group-hover:text-blue-500 transition-colors leading-tight italic uppercase tracking-tighter">
                  {trip.title}
                </h3>
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Compiled by <span className="text-slate-400">{trip.user}</span>
                </p>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-slate-900">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => handleLike(trip.id)}
                    className={`flex items-center gap-2 transition-all duration-300 ${trip.liked ? "text-rose-500 scale-110" : "text-slate-500 hover:text-rose-400"}`}
                  >
                    <Heart size={20} fill={trip.liked ? "currentColor" : "none"} strokeWidth={2.5} />
                    <span className="text-xs font-black italic">{trip.likes.toLocaleString()}</span>
                  </button>
                  <button className="text-slate-500 hover:text-blue-400 transition-colors">
                    <MessageCircle size={20} strokeWidth={2.5} />
                  </button>
                </div>
                <Share2 size={20} strokeWidth={2.5} className="text-slate-500 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}