import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/forum/settings");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pl-10">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez vos préférences et paramètres de compte
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Profil</h2>
          <p className="text-muted-foreground">
            Bientôt disponible - Modifiez vos informations personnelles
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="text-muted-foreground">
            Bientôt disponible - Gérez vos préférences de notifications
          </p>
        </div>
      </div>
    </div>
  );
}
