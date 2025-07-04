import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/forum/profile");
  }

  redirect(`/forum/profile/${user.id}`);
}
