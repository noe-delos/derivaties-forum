
import { Suspense } from "react";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";

import { SearchInterface } from "@/components/search/search-interface";
import { enhancedSearchPosts, getPopularTags } from "@/lib/services/search";
import { createClient } from "@/lib/supabase/server";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    type?: string;
    sort?: string;
    nl?: string; // natural language flag
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { q: query, category, type, sort, nl } = params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  const queryClient = new QueryClient();

  // Prefetch popular tags
  await queryClient.prefetchQuery({
    queryKey: ["popular-tags"],
    queryFn: () => getPopularTags(),
  });

  // If we have a search query, prefetch the first page of results
  if (query) {
    const isNaturalLanguage = nl === "true";
    const filters = {
      category: category as any,
      type: type as any,
      sortBy: (sort as any) || "recent",
    };

    await queryClient.prefetchInfiniteQuery({
      queryKey: ["search", query, filters, isAuthenticated, isNaturalLanguage],
      queryFn: ({ pageParam = 0 }) =>
        enhancedSearchPosts({
          query,
          filters,
          pageParam,
          isAuthenticated,
          isNaturalLanguage,
        }),
      initialPageParam: 0,
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <Suspense fallback={<div>Chargement...</div>}>
          <SearchInterface
            initialQuery={query}
            initialFilters={{
              category: category as any,
              type: type as any,
              sortBy: (sort as any) || "recent",
            }}
            initialNaturalLanguage={nl === "true"}
            isAuthenticated={isAuthenticated}
          />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}
