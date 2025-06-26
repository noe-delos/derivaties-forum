/* eslint-disable react/no-unescaped-entities */
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { fetchAdminStats } from "@/lib/services/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const queryClient = new QueryClient();

  // Prefetch admin stats
  await queryClient.prefetchQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchAdminStats(supabase),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de l'activité du forum
          </p>
        </div>

        <AdminDashboard />
      </div>
    </HydrationBoundary>
  );
}
