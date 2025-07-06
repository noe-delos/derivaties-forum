"use client";

import { useAuth } from "@/hooks/use-auth";
import { MainLayoutClient } from "./main-layout-client";

interface MainLayoutWrapperProps {
  children: React.ReactNode;
}

export function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  const { isAuthenticated, profile, isLoading } = useAuth();

  return (
    <MainLayoutClient isAuthenticated={isAuthenticated} profile={profile}>
      {children}
    </MainLayoutClient>
  );
}