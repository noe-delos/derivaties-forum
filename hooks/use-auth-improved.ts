"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useSupabase } from "@/hooks/use-supabase";
import { User as UserType } from "@/lib/types";

export function useAuthImproved() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabase();

  const isAuthenticated = !!user;

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data as UserType);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            // Fetch profile for logged in user
            const { data } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();
            
            if (mounted) {
              setProfile(data as UserType);
            }
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event);

      switch (event) {
        case "SIGNED_IN":
          if (session?.user) {
            setUser(session.user);
            // Fetch fresh profile data
            const { data } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();
            setProfile(data as UserType);
          }
          break;
          
        case "SIGNED_OUT":
          setUser(null);
          setProfile(null);
          break;
          
        case "TOKEN_REFRESHED":
        case "USER_UPDATED":
          if (session?.user) {
            setUser(session.user);
            // Profile data usually doesn't change on token refresh
            // Only refetch if we don't have it
            if (!profile && mounted) {
              const { data } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single();
              setProfile(data as UserType);
            }
          }
          break;
      }
    });

    // Listen for custom refresh-auth events
    const handleRefreshAuth = () => {
      if (user?.id && mounted) {
        refreshProfile();
      }
    };

    window.addEventListener("refresh-auth", handleRefreshAuth);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("refresh-auth", handleRefreshAuth);
    };
  }, [supabase]); // Only depend on supabase client

  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
    supabase,
    signOut,
    refreshProfile,
  };
}