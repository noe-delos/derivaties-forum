/* eslint-disable react/no-unescaped-entities */
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { AnalyticsView } from "@/components/admin/analytics-view";
import { fetchAdminStats } from "@/lib/services/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const queryClient = new QueryClient();

  // Prefetch analytics data
  await queryClient.prefetchQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchAdminStats(supabase),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Statistiques</h1>
          <p className="text-muted-foreground">
            Analyse détaillée de l'activité du forum
          </p>
        </div>

        <AnalyticsView />
      </div>
    </HydrationBoundary>
  );
}
