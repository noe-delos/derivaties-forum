import { createClient } from "@/lib/supabase/server";
import { User as UserType } from "@/lib/types";
import { MainLayoutClient } from "@/components/layout/main-layout-client";

export default async function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get current user - use getUser() instead of getSession() for better reliability
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
    <MainLayoutClient isAuthenticated={!!user} profile={profile}>
      {children}
    </MainLayoutClient>
  );
}
