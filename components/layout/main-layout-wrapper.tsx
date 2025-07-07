"use client";

import { useServerAuth } from "./root-layout-client";
import { MainLayoutClient } from "./main-layout-client";

interface MainLayoutWrapperProps {
  children: React.ReactNode;
}

export function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  const { isAuthenticated, profile } = useServerAuth();

  return (
    <MainLayoutClient isAuthenticated={isAuthenticated} profile={profile}>
      {children}
    </MainLayoutClient>
  );
}