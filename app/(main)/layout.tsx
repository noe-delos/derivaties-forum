"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isProfilePage = pathname.startsWith("/profile");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Conditionally render Header - hide on profile pages */}
          {!isProfilePage && <Header />}

          <main className="flex-1 container py-6">
            {/* Conditionally render layout - full width on profile pages */}
            {isProfilePage ? (
              <div className="w-full">{children}</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">{children}</div>
                <div className="hidden lg:block">
                  {/* Right sidebar for ads/CTA */}
                  <div className="sticky top-20 space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="h-32 bg-muted rounded flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          Publicité
                        </span>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="h-32 bg-muted rounded flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          Publicité
                        </span>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="h-32 bg-muted rounded flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          Publicité
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
