import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { CommentsManagement } from "@/components/admin/comments-management";
import { fetchAllComments } from "@/lib/services/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCommentsPage() {
  const supabase = await createClient();
  const queryClient = new QueryClient();

  // Prefetch comments
  await queryClient.prefetchQuery({
    queryKey: ["admin-comments"],
    queryFn: () => fetchAllComments(supabase),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des commentaires</h1>
          <p className="text-muted-foreground">
            Modérez et gérez les commentaires du forum
          </p>
        </div>

        <CommentsManagement />
      </div>
    </HydrationBoundary>
  );
}
