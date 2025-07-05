"use client";

import { useAuth } from "@/hooks/use-auth";
import { AuthRedirect } from "@/components/auth/auth-redirect";
import { MainLayoutClient } from "./main-layout-client";

interface MainLayoutWrapperProps {
  children: React.ReactNode;
}

export function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  const { isAuthenticated, profile, isLoading } = useAuth();

  return (
    <AuthRedirect requireAuth={true} redirectTo="/auth/login">
      <MainLayoutClient isAuthenticated={isAuthenticated} profile={profile}>
        {children}
      </MainLayoutClient>
    </AuthRedirect>
  );
}