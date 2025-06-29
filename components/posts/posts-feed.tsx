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
import { PostCategory, SearchFilters } from "@/lib/types";
import { useAuth } from "@/lib/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PostsFeedProps {
  category?: PostCategory;
  filters?: SearchFilters;
  className?: string;
}

export function PostsFeed({ category, filters, className }: PostsFeedProps) {
  const { isAuthenticated, profile } = useAuth();
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["posts", category, filters, isAuthenticated],
    queryFn: ({ pageParam = 0 }) =>
      fetchPosts({
        pageParam,
        category,
        filters,
        isAuthenticated,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const fetchNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (inView) {
      fetchNext();
    }
  }, [inView, fetchNext]);

  const posts = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
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
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground">Aucune publication trouvée.</p>
            {category && (
              <p className="text-sm text-muted-foreground">
                Essayez de changer de catégorie ou d'ajuster vos filtres.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {posts.map((post, index) => {
          // Show blurred content for non-public posts to anonymous users
          const shouldBlur = !isAuthenticated && !post.is_public;

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
