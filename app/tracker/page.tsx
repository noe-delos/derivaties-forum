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
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tracker de stages</h1>
          <p className="text-muted-foreground mt-2">
            Suivez vos candidatures et gérez vos stages en finance
          </p>
        </div>
      </div>
      <TrackerInterface />
    </div>
  );
}
