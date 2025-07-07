import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { Suspense } from "react";

import { fetchPosts } from "@/lib/services/posts";
import { createClient } from "@/lib/supabase/server";
import HomePageContent from "./home-page-content";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  const queryClient = new QueryClient();

  // Prefetch the first page of posts
  await queryClient.prefetchInfiniteQuery({
    queryKey: ["posts", undefined, undefined, "", false, isAuthenticated],
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
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-4 pt-10">Chargement...</div>
        }
      >
        <HomePageContent />
      </Suspense>
    </HydrationBoundary>
  );
}