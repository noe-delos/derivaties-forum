"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { User } from "@/lib/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Get auth user
  const { data: authUser, refetch: refetchAuth } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 0, // Always refetch to ensure fresh state
    refetchOnWindowFocus: true,
  });

  // Get profile data
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["user-profile", authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return null;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;
      return data as User;
    },
    enabled: !!authUser?.id,
    staleTime: 0,
  });

  // Listen to auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session?.user);

      if (event === "SIGNED_IN") {
        // Invalidate all auth-related queries
        await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
        if (session?.user) {
          await queryClient.invalidateQueries({
            queryKey: ["user-profile", session.user.id],
          });
        }
        // Refresh the page to update all components
        router.refresh();
      } else if (event === "SIGNED_OUT") {
        // Clear all queries on logout
        queryClient.clear();
        // Refresh the page to update all components
        router.refresh();
      }
    });

    setIsLoading(false);

    return () => subscription.unsubscribe();
  }, [supabase.auth, queryClient, router]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear all cached data
      queryClient.clear();

      // Force a hard refresh to ensure clean state
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const refreshAuth = async () => {
    await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    if (authUser?.id) {
      await queryClient.invalidateQueries({
        queryKey: ["user-profile", authUser.id],
      });
    }
  };

  return {
    user: authUser,
    profile,
    isLoading,
    isAuthenticated: !!authUser,
    signOut,
    refreshAuth,
    refetchProfile,
  };
}
