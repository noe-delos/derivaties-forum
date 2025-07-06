import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";

import { PostsFeed } from "@/components/posts/posts-feed";
import { fetchPosts } from "@/lib/services/posts";
import { createClient } from "@/lib/supabase/server";
import { POST_CATEGORIES, PostCategory } from "@/lib/types";
import { PostSkeleton } from "@/components/posts/post-skeleton";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categoryParam } = await params;
  const category = categoryParam as PostCategory;

  // Check if category is valid
  if (!POST_CATEGORIES[category]) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  const queryClient = new QueryClient();

  // Prefetch the first page of posts for this category
  await queryClient.prefetchInfiniteQuery({
    queryKey: ["posts", category, undefined, isAuthenticated],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchPosts({
        pageParam,
        category,
        isAuthenticated,
      });
    },
    initialPageParam: 0,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div className="pl-10">
          <h1 className="text-2xl font-semibold">
            {POST_CATEGORIES[category]}
          </h1>
          <p className="text-muted-foreground">
            Découvrez les discussions dans cette catégorie
          </p>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          }
        >
          <PostsFeed category={category} />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}

export async function generateStaticParams() {
  return Object.keys(POST_CATEGORIES).map((category) => ({
    category,
  }));
}
