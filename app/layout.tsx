import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/server";
import { User as UserType } from "@/lib/types";
import { RootLayoutClient } from "@/components/layout/root-layout-client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Forum Finance - Discussions sur les entretiens en finance",
  description:
    "Plateforme de discussion dédiée aux entretiens en finance, aux stages et aux conseils entre étudiants et professionnels.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: UserType | null = null;

  // If user is authenticated, fetch their profile
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    profile = data as UserType;
  }

  return (
    <html lang="fr">
      <body className={inter.className}>
        <RootLayoutClient isAuthenticated={!!user} profile={profile}>
          <QueryProvider>
            {children}
            <Toaster 
              position="top-right" 
              richColors 
              theme="light"
              toastOptions={{
                style: {
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  color: '#1f2937'
                },
              }}
            />
          </QueryProvider>
        </RootLayoutClient>
      </body>
    </html>
  );
}
