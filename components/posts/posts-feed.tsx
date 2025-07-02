/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { PostCard } from "./post-card";
import { PostSkeleton } from "./post-skeleton";
import { fetchPosts } from "@/lib/services/posts";
import { enhancedSearchPosts } from "@/lib/services/search";
import { PostCategory, SearchFilters } from "@/lib/types";
import { useAuth } from "@/lib/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PostsFeedProps {
  category?: PostCategory;
  filters?: SearchFilters;
  searchQuery?: string;
  isNaturalLanguage?: boolean;
  className?: string;
}

export function PostsFeed({
  category,
  filters,
  searchQuery = "",
  isNaturalLanguage = false,
  className,
}: PostsFeedProps) {
  console.log("📋 PostsFeed rendered with props:", {
    category,
    filters,
    searchQuery,
    isNaturalLanguage,
    className,
  });

  const { isAuthenticated, profile } = useAuth();
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // Determine if we should use search or regular fetch
  const hasSearchQuery = searchQuery.trim().length > 0;
  const hasFilters =
    filters &&
    Object.keys(filters).some((key) => {
      const value = filters[key as keyof SearchFilters];
      return Array.isArray(value) ? value.length > 0 : !!value;
    });
  const shouldUseSearch = hasSearchQuery || hasFilters;

  console.log("🔍 PostsFeed search decision:", {
    hasSearchQuery,
    hasFilters,
    shouldUseSearch,
    searchQueryLength: searchQuery.length,
    filtersCount: filters ? Object.keys(filters).length : 0,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: [
      "posts",
      category,
      filters,
      searchQuery,
      isNaturalLanguage,
      isAuthenticated,
    ],
    queryFn: ({ pageParam = 0 }) => {
      console.log(`📥 PostsFeed queryFn called with pageParam: ${pageParam}`);

      if (shouldUseSearch) {
        console.log("🔍 Using enhancedSearchPosts");
        return enhancedSearchPosts({
          query: searchQuery.trim(),
          filters: filters || {},
          pageParam,
          isAuthenticated,
          isNaturalLanguage,
        });
      } else {
        console.log("📰 Using regular fetchPosts");
        return fetchPosts({
          pageParam,
          category,
          filters,
          isAuthenticated,
        });
      }
    },
    getNextPageParam: (lastPage) => {
      console.log("📄 getNextPageParam called with lastPage:", {
        dataLength: lastPage.data.length,
        nextPage: lastPage.nextPage,
      });
      return lastPage.nextPage;
    },
    initialPageParam: 0,
  });

  const fetchNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log("📄 Fetching next page...");
      fetchNextPage();
    } else {
      console.log("📄 Not fetching next page:", {
        hasNextPage,
        isFetchingNextPage,
      });
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (inView) {
      console.log("👁️ Intersection observer triggered - fetching next page");
      fetchNext();
    }
  }, [inView, fetchNext]);

  const posts = data?.pages.flatMap((page) => page.data) ?? [];

  console.log("📊 PostsFeed current state:", {
    postsCount: posts.length,
    pagesLoaded: data?.pages.length || 0,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    error: error ? error.message : null,
  });

  if (isLoading) {
    console.log("⏳ PostsFeed showing loading state");
    return (
      <div className="space-y-4 pl-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    console.error("❌ PostsFeed error state:", error);
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Une erreur s'est produite lors du chargement des publications.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    console.log("📭 PostsFeed showing empty state");
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {hasSearchQuery
                ? "Aucun résultat trouvé pour votre recherche."
                : "Aucune publication trouvée."}
            </p>
            {(category || hasSearchQuery) && (
              <p className="text-sm text-muted-foreground">
                Essayez de changer{" "}
                {hasSearchQuery ? "vos mots-clés" : "de catégorie"} ou d'ajuster
                vos filtres.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log("✅ PostsFeed rendering posts successfully");
  return (
    <div className={className}>
      <div className="space-y-4">
        {posts.map((post, index) => {
          // Show blurred content for non-public posts to anonymous users
          const shouldBlur = !isAuthenticated;

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.05, // Stagger animation
                ease: "easeOut",
              }}
            >
              <PostCard
                post={post}
                isBlurred={shouldBlur}
                showActions={isAuthenticated || post.is_public}
                className="transform scale-95"
                isAuthenticated={isAuthenticated}
                profile={profile}
                isFeedView={true}
              />
            </motion.div>
          );
        })}

        {/* Infinite scroll trigger */}
        <div ref={ref} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Chargement...</span>
            </div>
          )}
        </div>

        {/* End of feed message */}
        {!hasNextPage && posts.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              Vous avez atteint la fin du feed !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
