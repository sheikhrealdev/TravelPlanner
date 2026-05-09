import { useState } from 'react'
import { supabase } from '../supabaseClient' // Path check: src/components se ek folder peechay src/ mein jana hai
import { useEffect } from 'react';

export default function AuthPage() {

   useEffect(() => {
    // Jab bhi koi login page par aaye, purana kachra saaf kar do
    localStorage.clear();
    sessionStorage.clear();
  }, []);



  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  
  // 🚨 NAYA STATE: Password show/hide karne ke liye
  const [showPassword, setShowPassword] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Yahan hum result ko ek variable mein le rahe hain taake handle kar saken
    const { data, error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert(error.message)
    } else {
      // SUCCESS: Jab user login ho jaye
      console.log("Welcome:", data.user.email)
      // Note: Page automatically refresh nahi hoga, humein App.jsx mein logic lagana hoga
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <form onSubmit={handleAuth} className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 w-full max-w-md shadow-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
            {isSignUp ? 'Create ID' : 'Terminal Login'}
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Tokyo-Vault Auth System</p>
        </div>

        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="EMAIL ADDRESS" 
            required
            value={email} // Controlled component banaya
            // 🚨 CHANGED: 'uppercase' hata kar 'lowercase' laga diya
            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white lowercase font-bold text-xs outline-none focus:border-blue-600 transition-colors placeholder:uppercase"
            // 🚨 CHANGED: State mein hamesha small letters save honge
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
          />
          
          {/* 🚨 CHANGED: Password ko ek relative div mein wrap kiya */}
          <div className="relative">
            <input 
              // State ke hisaab se type change hogi
              type={showPassword ? "text" : "password"} 
              placeholder="PASSWORD" 
              required
              value={password}
              // 'uppercase' hata diya taake password theek se nazar aaye, 'pr-16' add kiya button ki space ke liye
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold text-xs outline-none focus:border-blue-600 transition-colors pr-16"
              onChange={(e) => setPassword(e.target.value)}
            />
            {/* SHOW / HIDE Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button 
          disabled={loading}
          className="w-full bg-blue-600 py-4 rounded-2xl text-white font-black uppercase italic tracking-widest shadow-xl shadow-blue-900/40 mt-8 hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isSignUp ? 'Initialize Account' : 'Access Terminal')}
        </button>

        <p 
          className="text-slate-500 text-[10px] font-black uppercase text-center mt-6 cursor-pointer hover:text-blue-500 transition-colors tracking-widest"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Already have an ID? — Sign In' : 'Need a Traveler ID? — Sign Up'}
        </p>
      </form>
    </div>
  )
}