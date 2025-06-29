"use client";

import { useSupabase } from "./use-supabase";

export function useAuth() {
  const supabase = useSupabase();

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return {
    supabase,
    signOut,
  };
}
