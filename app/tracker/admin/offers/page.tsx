import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { FinanceJobsManager } from "@/components/tracker/finance-jobs-manager";
import { fetchFinanceJobs, fetchFinanceJobStats } from "@/lib/services/finance-jobs";
import { createClient } from "@/lib/supabase/server";

export default async function TrackerAdminPage() {
  const supabase = await createClient();
  const queryClient = new QueryClient();

  // Prefetch finance jobs and stats
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["finance-jobs", {}],
      queryFn: () => fetchFinanceJobs(supabase, {}, 1, 20),
    }),
    queryClient.prefetchQuery({
      queryKey: ["finance-job-stats"],
      queryFn: () => fetchFinanceJobStats(supabase),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tracker - Modération</h1>
          <p className="text-muted-foreground">
            Gestion des offres d'emploi finance
          </p>
        </div>

        <FinanceJobsManager />
      </div>
    </HydrationBoundary>
  );
}