import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useProfileStore } from './store/profileStore';
import { Toaster } from 'react-hot-toast'; // 1. Import Toaster
import { useTripStore } from './store/tripStore';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import AuthPage from './components/AuthPage';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const { fetchProfile } = useProfileStore();
  const { activeTrip } = useTripStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  if (initializing) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic tracking-widest">
      INITIALIZING SYSTEM...
    </div>
  );

  if (!session) return <AuthPage />;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      
      {/* 2. Toaster ko yahan rakhein taake ye top layer par rahay */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'border border-slate-800 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest',
          duration: 3000,
          style: {
            background: '#0f172a',
            color: '#fff',
            padding: '16px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'
          }
        }} 
      />

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Navbar />
        <main key={activeTrip?.id} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 max-w-7xl mx-auto w-full">
            <AppRoutes /> 
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;