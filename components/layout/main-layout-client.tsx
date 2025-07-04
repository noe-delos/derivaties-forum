"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { getPopularTags } from "@/lib/services/search";
import { User as UserType } from "@/lib/types";

interface MainLayoutClientProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  profile: UserType | null;
}

export function MainLayoutClient({
  children,
  isAuthenticated,
  profile,
}: MainLayoutClientProps) {
  const pathname = usePathname();
  const isProfilePage = pathname.startsWith("/forum/profile");
  const isPostPage = pathname.startsWith("/forum/post/");
  const isHomePage = pathname === "/forum";
  const isAdminPage = pathname.startsWith("/forum/admin");

  // Get popular tags for the header
  const { data: popularTags = [] } = useQuery({
    queryKey: ["popular-tags"],
    queryFn: () => getPopularTags(20),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Hide AppSidebar on admin pages */}
        {!isAdminPage && <AppSidebar isAuthenticated={isAuthenticated} profile={profile} />}
        <div className="flex-1 flex flex-col">
          {/* Conditionally render Header - hide on profile and admin pages */}
          {!isProfilePage && !isAdminPage && (
            <Header
              isAuthenticated={isAuthenticated}
              profile={profile}
              popularTags={popularTags}
            />
          )}

          <main className="flex-1 container py-6">
            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
