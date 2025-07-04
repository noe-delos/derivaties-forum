import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { UsersManagement } from "@/components/admin/users-management";
import { fetchAllUsers } from "@/lib/services/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const queryClient = new QueryClient();

  // Prefetch users
  await queryClient.prefetchQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchAllUsers(supabase),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les rôles et les permissions des utilisateurs
          </p>
        </div>

        <UsersManagement />
      </div>
    </HydrationBoundary>
  );
}
