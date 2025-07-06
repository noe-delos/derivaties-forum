"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { User } from "@supabase/supabase-js";
import { useSupabase } from "@/hooks/use-supabase";
import { User as UserType } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  profile: UserType | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  supabase: ReturnType<typeof useSupabase>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabase();

  const isAuthenticated = !!user;

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }, [supabase]);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data as UserType);
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
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

      try {
        switch (event) {
          case "SIGNED_IN":
            if (session?.user) {
              setUser(session.user);
              await fetchProfile(session.user.id);
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
              // Only refetch profile if we don't have it
              if (!profile) {
                await fetchProfile(session.user.id);
              }
            }
            break;
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
      }
    });

    // Listen for custom refresh-auth events (e.g., after purchases)
    const handleRefreshAuth = () => {
      if (user?.id && mounted) {
        fetchProfile(user.id);
      }
    };

    window.addEventListener("refresh-auth", handleRefreshAuth);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("refresh-auth", handleRefreshAuth);
    };
  }, [supabase, fetchProfile]); // Remove user?.id dependency to avoid re-runs

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated,
        supabase,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
