import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { TrackerInterface } from "@/components/tracker/tracker-interface";

export default async function TrackerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <TrackerInterface />
    </div>
  );
}
