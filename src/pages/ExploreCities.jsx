import React, { useState, useMemo } from "react";
import { tokyoDistricts } from "../data/mockCities";
import { Search, Plus, Landmark, Check, Navigation, XCircle } from "lucide-react";
import { useTripStore } from "../store/tripStore";

export default function ExploreCities() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Performance Fix: Use selectors to prevent unnecessary re-renders
  const selectedDistricts = useTripStore((state) => state.selectedDistricts || []);
  const toggleDistrict = useTripStore((state) => state.toggleDistrict);

  // Performance Fix: Memoize the filtered list so it only updates when typing
  const filteredDistricts = useMemo(() => {
    return tokyoDistricts.filter((district) =>
      district.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-l-4 border-blue-600 pl-8">
        <div>
          <h1 className="text-6xl font-black text-blue-600 italic uppercase tracking-tighter leading-none">
            Explore Tokyo
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[12px] mt-2">
            Sector Selection: {selectedDistricts.length} Active
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Search districts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-900 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 transition-all shadow-2xl"
          />
        </div>
      </header>

      {/* RESULT SECTION */}
      {filteredDistricts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredDistricts.map((district) => {
            const isSelected = selectedDistricts.some(d => d.id === district.id);
            
            return (
              <div
                key={district.id}
                className={`group relative bg-slate-950 border rounded-[3rem] overflow-hidden transition-all duration-500 flex flex-col ${
                  isSelected ? "border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.1)]" : "border-slate-900 hover:border-blue-500/30"
                }`}
              >
                {/* Image Section - Optimization: added loading="lazy" and lower width */}
                <div className="h-64 overflow-hidden relative">
                  <img
                    src={`${district.image}?auto=format&fit=crop&q=60&w=600`}
                    alt={district.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 will-change-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-6 left-8">
                     <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">
                        <Navigation size={12} /> SECTOR_{district.id.toUpperCase()}
                     </div>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                      {district.name}
                    </h3>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 flex-1 flex flex-col space-y-6">
                  <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-wide opacity-80">
                    {district.description}
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">
                      <Landmark size={12} /> Target Destinations
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {district.spots.map((spot) => (
                        <span key={spot} className="text-[10px] font-black text-slate-400 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                          {spot}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-auto">
                    <button
                      onClick={() => toggleDistrict(district)}
                      className={`w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] transition-all font-black uppercase italic tracking-tighter text-sm ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-lg"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-xl"
                      }`}
                    >
                      {isSelected ? (
                        <> <Check size={18} strokeWidth={3} /> Sector Active </>
                      ) : (
                        <> <Plus size={18} /> Add to Trip </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* NOT FOUND STATE */
        <div className="flex flex-col items-center justify-center py-32 bg-slate-950 border border-dashed border-slate-800 rounded-[3rem] text-center">
          <div className="bg-slate-900 p-6 rounded-full mb-6">
            <XCircle size={48} className="text-slate-700" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">
            No Sectors Detected
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest max-w-xs leading-relaxed">
            Your search for "{searchTerm}" returned no matching Tokyo districts.
          </p>
          <button 
            onClick={() => setSearchTerm("")}
            className="mt-8 text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] hover:text-blue-400 transition-colors"
          >
            // Reset Search Filter
          </button>
        </div>
      )}
    </div>
  );
}