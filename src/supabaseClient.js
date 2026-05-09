import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// 🚨 GLOBAL RATE LIMIT CONFIGURATION
// Aap yahan se poori app ki limit ek saath control kar sakte hain
export const RATE_LIMIT_CONFIG = {
  // Data fetch karne ki limit
  fetch: {
    count: 50,      // Ek minute mein kitni requests? (Barha kar 50 kar di hai)
    frame: 60       // Kitne seconds mein? (1 minute)
  },
  // Naya data add ya upload karne ki limit
  action: {
    count: 15,
    frame: 60
  }
};