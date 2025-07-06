import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { TrackerInterface } from "@/components/tracker/tracker-interface";
import { fetchFinanceJobs, fetchFinanceJobStats, getUniqueCompanies, getUniqueLocations } from "@/lib/services/finance-jobs";

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

  const queryClient = new QueryClient();

  // Prefetch finance jobs data
  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["finance-jobs", {}, 1, 'default', 'default'],
        queryFn: () => fetchFinanceJobs(supabase, {}, 1, 20),
      }),
      queryClient.prefetchQuery({
        queryKey: ["finance-job-stats"],
        queryFn: () => fetchFinanceJobStats(supabase),
      }),
      queryClient.prefetchQuery({
        queryKey: ["finance-job-companies"],
        queryFn: () => getUniqueCompanies(supabase),
      }),
      queryClient.prefetchQuery({
        queryKey: ["finance-job-locations"],
        queryFn: () => getUniqueLocations(supabase),
      }),
    ]);
  } catch (error) {
    console.error('Error prefetching finance jobs data:', error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <TrackerInterface />
      </div>
    </HydrationBoundary>
  );
}
