import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";

import { PostsFeed } from "@/components/posts/posts-feed";
import { fetchPosts } from "@/lib/services/posts";
import { createClient } from "@/lib/supabase/server";

export default async function PopularPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  const queryClient = new QueryClient();

  // Prefetch the first page of popular posts
  await queryClient.prefetchInfiniteQuery({
    queryKey: ["posts", undefined, { sortBy: "popular" }, isAuthenticated],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchPosts({
        pageParam,
        filters: { sortBy: "popular" },
        isAuthenticated,
      });
    },
    initialPageParam: 0,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Publications populaires</h1>
          <p className="text-muted-foreground">
            Les discussions les plus appréciées de la communauté
          </p>
        </div>

        <PostsFeed filters={{ sortBy: "popular" }} />
      </div>
    </HydrationBoundary>
  );
}
