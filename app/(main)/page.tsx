"use server";

import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";

import { PostsFeed } from "@/components/posts/posts-feed";
import { fetchPosts } from "@/lib/services/posts";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  const queryClient = new QueryClient();

  // Prefetch the first page of posts
  await queryClient.prefetchInfiniteQuery({
    queryKey: ["posts", undefined, undefined, isAuthenticated],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchPosts({
        pageParam,
        isAuthenticated,
      });
    },
    initialPageParam: 0,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <PostsFeed />
      </div>
    </HydrationBoundary>
  );
}
