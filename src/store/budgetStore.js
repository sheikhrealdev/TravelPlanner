import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase , RATE_LIMIT_CONFIG } from "../supabaseClient";

export const useBudgetStore = create(
  persist(
    (set, get) => ({
      expenses: [],
      baseCurrency: "USD",
      foreignCurrency: "PKR",
      manualRate: 280,
      rateDirection: "baseToForeign",

      setExpenses: (items) => set({ expenses: items }),

      // --- 🚨 NAYA: FETCH EXPENSES FROM DATABASE 🚨 ---
      fetchExpenses: async (tripId) => {
        if (!tripId) return;

        try {
          // 1. Rate Limiting Check
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const { data: isLimited } = await supabase.rpc('is_rate_limited', { 
              uid: user.id, 
              limit_count: RATE_LIMIT_CONFIG.fetch.count, // 👈 Ab ye hamesha 50 uthayega
              seconds_frame: RATE_LIMIT_CONFIG.fetch.frame 
            });

            if (isLimited) {
              console.warn("Budget Sync: Rate limit hit. Cooling down...");
              return;
            }
          }

          // --- Aapka Original Logic ---
          const { data, error } = await supabase
            .from("expenses")
            .select("*")
            .eq("trip_id", tripId)
            .order("created_at", { ascending: false });

          if (!error && data) {
            set({ expenses: data });
          } else {
            console.error("Fetch Expenses Error:", error);
          }
        } catch (err) {
          console.error("Budget System Error:", err.message);
        }
      },

      // --- RETROACTIVE SETTINGS UPDATE ---
      updateSettings: async (tripId, newSettings) => {
        const { base, foreign, rate, direction } = newSettings;
        const numRate = Number(rate);

        set({
          baseCurrency: base,
          foreignCurrency: foreign,
          manualRate: numRate,
          rateDirection: direction,
        });

        const updatedExpenses = get().expenses.map((exp) => {
          const fAmt = Number(exp.foreign_amount);
          const bAmt =
            direction === "baseToForeign" ? fAmt / numRate : fAmt * numRate;
          return {
            ...exp,
            base_amount: parseFloat(bAmt.toFixed(2)),
            base_currency: base,
            foreign_currency: foreign,
            exchange_rate_used: numRate,
          };
        });

        try {
          await Promise.all(
            updatedExpenses.map((exp) =>
              supabase
                .from("expenses")
                .update({
                  base_amount: exp.base_amount,
                  base_currency: base,
                  foreign_currency: foreign,
                  exchange_rate_used: numRate,
                })
                .eq("id", exp.id),
            ),
          );
          set({ expenses: updatedExpenses });
        } catch (err) {
          console.error("Retroactive Sync Failed:", err.message);
        }
      },

      // --- ADD EXPENSE (The Save Logic) ---
      addExpense: async (tripId, exp) => {
        const { manualRate, rateDirection, baseCurrency, foreignCurrency } =
          get();
        const fAmount = Number(exp.amount);

        const calculatedBase =
          rateDirection === "baseToForeign"
            ? fAmount / manualRate
            : fAmount * manualRate;

        const payload = {
          trip_id: tripId,
          description: exp.description,
          category: exp.category,
          foreign_amount: parseFloat(fAmount.toFixed(2)),
          foreign_currency: foreignCurrency,
          base_amount: parseFloat(calculatedBase.toFixed(2)),
          base_currency: baseCurrency,
          exchange_rate_used: manualRate,
        };

        const { data, error } = await supabase
          .from("expenses")
          .insert([payload])
          .select();

        if (error) {
          alert("DB Error: " + error.message);
          console.error("Full Insert Error Object:", error);
        } else if (data) {
          set((state) => ({ expenses: [data[0], ...state.expenses] }));
        }
      },

      // --- UPDATE EXPENSE ---
      updateExpense: async (id, updatedData) => {
        const { manualRate, rateDirection, baseCurrency, foreignCurrency } =
          get();
        const fAmount = Number(updatedData.amount);
        const calculatedBase =
          rateDirection === "baseToForeign"
            ? fAmount / manualRate
            : fAmount * manualRate;

        const cleanPayload = {
          description: updatedData.description,
          category: updatedData.category,
          foreign_amount: parseFloat(fAmount.toFixed(2)),
          base_amount: parseFloat(calculatedBase.toFixed(2)),
          exchange_rate_used: manualRate,
          base_currency: baseCurrency, // Added back for consistency
          foreign_currency: foreignCurrency, // Added back for consistency
        };

        const { error } = await supabase
          .from("expenses")
          .update(cleanPayload)
          .eq("id", id);

        if (error) {
          alert("Update Error: " + error.message);
        } else {
          set((state) => ({
            expenses: state.expenses.map((exp) =>
              exp.id === id ? { ...exp, ...cleanPayload } : exp,
            ),
          }));
        }
      },

      // --- DELETE EXPENSE ---
      removeExpense: async (id) => {
        const { error } = await supabase.from("expenses").delete().eq("id", id);

        if (!error) {
          set((state) => ({
            expenses: state.expenses.filter((e) => e.id !== id),
          }));
        } else {
          console.error("Delete Error:", error.message);
        }
      },
    }),
    { name: "mission-budget-final-v10" }, // Name bumped to v10 to force fresh start
  ),
);
