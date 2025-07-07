import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsPage } from "@/components/notifications/notifications-page";
import { User as UserType } from "@/lib/types";

export default async function NotificationsPageWrapper() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/forum/notifications");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth/login");
  }

  return <NotificationsPage user={profile as UserType} />;
}