import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { ModeratorsManagement } from "@/components/admin/moderators-management";
import { fetchAllUsers } from "@/lib/services/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminModeratorsPage() {
  const supabase = await createClient();
  const queryClient = new QueryClient();

  // Prefetch users for moderator management
  await queryClient.prefetchQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchAllUsers(supabase),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des modérateurs</h1>
          <p className="text-muted-foreground">
            Gérez l'équipe de modération et leurs permissions
          </p>
        </div>

        <ModeratorsManagement />
      </div>
    </HydrationBoundary>
  );
}
