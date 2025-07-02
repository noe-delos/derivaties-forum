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
  const isProfilePage = pathname.startsWith("/profile");
  const isPostPage = pathname.startsWith("/post/");

  // Get popular tags for the header
  const { data: popularTags = [] } = useQuery({
    queryKey: ["popular-tags"],
    queryFn: () => getPopularTags(20),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar isAuthenticated={isAuthenticated} profile={profile} />
        <div className="flex-1 flex flex-col">
          {/* Conditionally render Header - hide on profile pages */}
          {!isProfilePage && (
            <Header
              isAuthenticated={isAuthenticated}
              profile={profile}
              popularTags={popularTags}
            />
          )}

          <main className="flex-1 container py-6">
            {/* Conditionally render layout - full width on profile and post pages */}
            {isProfilePage || isPostPage ? (
              <div className="w-full">{children}</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">{children}</div>
                {/* <div className="hidden lg:block">
                  <div className="sticky top-20 space-y-6">
                    <a
                      href="https://youtu.be/Hla7a2oWlMg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full aspect-video overflow-hidden rounded-xl group block"
                    >
                      <img
                        src="https://i.ytimg.com/vi/Hla7a2oWlMg/maxresdefault.jpg"
                        alt="Derivatives Coaching"
                        className="absolute inset-0 w-full h-full object-contain bg-black/90 group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

                      <div className="absolute bottom-4 right-4">
                        <div className="relative">
                          <div className="absolute inset-0 backdrop-blur-xs bg-black/10 rounded-lg" />
                          <span className="relative px-4 py-2 block font-medium text-white text-sm hover:scale-105 transition-all">
                            Accéder
                          </span>
                        </div>
                      </div>
                    </a>

                    <a
                      href="https://www.youtube.com/watch?v=3pd_C9bCWYQ&t=1s"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full aspect-video overflow-hidden rounded-xl group block"
                    >
                      <img
                        src="https://i.ytimg.com/vi/3pd_C9bCWYQ/hqdefault.jpg"
                        alt="Formation Elite"
                        className="absolute inset-0 w-full h-full object-cover object-center bg-black/90 group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

                      <div className="absolute bottom-4 right-4">
                        <div className="relative">
                          <div className="absolute inset-0 backdrop-blur-xs bg-black/10 rounded-lg" />
                          <span className="relative px-4 py-2 block font-medium text-white text-sm hover:scale-105 transition-all">
                            Accéder
                          </span>
                        </div>
                      </div>
                    </a>
                  </div>
                </div> */}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
