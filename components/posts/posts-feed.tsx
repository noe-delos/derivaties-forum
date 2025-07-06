/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useCallback, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { PostCard } from "./post-card";
import { PostSkeleton } from "./post-skeleton";
import { fetchPosts } from "@/lib/services/posts";
import { enhancedSearchPosts } from "@/lib/services/search";
import { PostCategory, SearchFilters } from "@/lib/types";
import { useAuth } from "@/lib/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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
  const { isAuthenticated, profile } = useAuth();
  const [purchasedPosts, setPurchasedPosts] = useState<Set<string>>(new Set());
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // Fetch purchased posts for authenticated users
  useEffect(() => {
    async function fetchPurchasedPosts() {
      if (!isAuthenticated || !profile) return;

      try {
        const { data, error } = await supabase
          .from("user_purchased_content")
          .select("post_id")
          .eq("user_id", profile.id);

        if (error) {
          console.error("Error fetching purchased posts:", error);
          return;
        }

        const purchasedPostIds = new Set(
          data?.map((item) => item.post_id) || []
        );
        setPurchasedPosts(purchasedPostIds);
      } catch (error) {
        console.error("Error fetching purchased posts:", error);
      }
    }

    fetchPurchasedPosts();
  }, [isAuthenticated, profile, supabase]);

  // Handle purchase
  const handlePurchase = useCallback(
    async (postId: string, contentType: "interview" | "correction") => {
      // Refresh purchased posts after successful purchase
      if (isAuthenticated && profile) {
        // Update purchased posts state immediately
        setPurchasedPosts((prev) => new Set([...prev, postId]));

        // Refresh purchased posts from database
        const { data, error } = await supabase
          .from("user_purchased_content")
          .select("post_id")
          .eq("user_id", profile.id);

        if (!error && data) {
          const purchasedPostIds = new Set(data.map((item) => item.post_id));
          setPurchasedPosts(purchasedPostIds);
        }

        queryClient.invalidateQueries({ queryKey: ["user"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("refresh-auth"));
        }
      }
    },
    [isAuthenticated, profile, supabase, queryClient]
  );

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
        return fetchPosts({
          pageParam,
          category,
          filters,
          isAuthenticated,
        });
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextPage;
    },
    initialPageParam: 0,
  });

  const fetchNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (inView) {
      console.log("👁️ Intersection observer triggered - fetching next page");
      fetchNext();
    }
  }, [inView, fetchNext]);

  const posts = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-5">
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

  console.log("✅ PostsFeed rendering posts successfully", posts);
  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {posts.map((post, index) => {
          const isPurchased = purchasedPosts.has(post.id);

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
                showActions={isAuthenticated || post.is_public}
                className="transform scale-95"
                isAuthenticated={isAuthenticated}
                profile={profile}
                isFeedView={true}
                isPurchased={isPurchased}
                onPurchase={handlePurchase}
              />
            </motion.div>
          );
        })}

        {/* Infinite scroll trigger - spans both columns */}
        <div
          ref={ref}
          className="col-span-1 md:col-span-2 flex justify-center py-4"
        >
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Chargement...</span>
            </div>
          )}
        </div>

        {/* End of feed message - spans both columns */}
        {!hasNextPage && posts.length > 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-8">
            <p className="text-muted-foreground text-sm">
              Vous avez atteint la fin du feed !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
