"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

interface AuthRedirectProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthRedirect({
  children,
  requireAuth = true,
  redirectTo = "/auth/login",
}: AuthRedirectProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        // Redirect to login if auth is required but user is not authenticated
        const currentPath = window.location.pathname;
        const redirectUrl = `${redirectTo}${
          currentPath !== "/"
            ? `?redirectTo=${encodeURIComponent(currentPath)}`
            : ""
        }`;
        router.replace(redirectUrl);
      } else if (!requireAuth && isAuthenticated) {
        // Redirect authenticated users away from auth pages
        router.replace(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // If auth is required but user is not authenticated, show nothing (will redirect)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If auth is not required but user is authenticated, show nothing (will redirect)
  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
