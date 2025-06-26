import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { PostsModeration } from "@/components/admin/posts-moderation";
import { fetchPendingPosts } from "@/lib/services/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPostsPage() {
  const supabase = await createClient();
  const queryClient = new QueryClient();

  // Prefetch pending posts
  await queryClient.prefetchQuery({
    queryKey: ["admin-pending-posts"],
    queryFn: () => fetchPendingPosts(supabase),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Modération des publications</h1>
          <p className="text-muted-foreground">
            Approuvez ou rejetez les publications en attente de modération
          </p>
        </div>

        <PostsModeration />
      </div>
    </HydrationBoundary>
  );
}
