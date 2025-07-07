"use client";

import { createContext, useContext, ReactNode } from "react";
import { User as UserType } from "@/lib/types";

interface AuthContextType {
  isAuthenticated: boolean;
  profile: UserType | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface RootLayoutClientProps {
  children: ReactNode;
  isAuthenticated: boolean;
  profile: UserType | null;
}

export function RootLayoutClient({ children, isAuthenticated, profile }: RootLayoutClientProps) {
  return (
    <AuthContext.Provider value={{ isAuthenticated, profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useServerAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useServerAuth must be used within RootLayoutClient");
  }
  return context;
}