import { createClient } from "@/utils/supabase/server";
import { User as UserType } from "@/lib/types";
import { MainLayoutClient } from "@/components/layout/main-layout-client";

export default async function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let profile: UserType | null = null;

  // If user is authenticated, fetch their profile
  if (session?.user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    profile = data as UserType;
  }

  return (
    <MainLayoutClient isAuthenticated={!!session?.user} profile={profile}>
      {children}
    </MainLayoutClient>
  );
}
