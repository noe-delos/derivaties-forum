"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { Loader2, FileText, MessageCircle, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostCard } from "@/components/posts/post-card";
import { PostSkeleton } from "../posts/post-skeleton";
import { fetchUserPosts } from "@/lib/services/profile";
import { useServerAuth } from "@/components/layout/root-layout-client";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/lib/types";

interface ProfilePostsProps {
  userId: string;
  showAll?: boolean;
  className?: string;
}

export function ProfilePosts({
  userId,
  showAll = false,
  className,
}: ProfilePostsProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);
  const supabase = createClient();
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setIsAuthenticated(true);

          // Fetch user profile
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          setProfile(data);
        } else {
          setIsAuthenticated(false);
          setProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);

        // Fetch user profile
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setProfile(data);
      } else {
        setIsAuthenticated(false);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["user-posts", userId],
    queryFn: ({ pageParam = 0 }) => {
      console.log("🔍 Fetching user posts:", {
        userId,
        pageParam,
        isAuthenticated,
      });
      return fetchUserPosts({
        userId,
        pageParam,
        isAuthenticated,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const posts = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.count || 0;

  console.log("📊 ProfilePosts state:", {
    isLoading,
    error: error?.message,
    postsCount: posts.length,
    totalCount,
    userId,
    isAuthenticated,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Publications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-20 bg-muted rounded animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error("❌ Error loading user posts:", error);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Publications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Erreur lors du chargement des publications
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Publications (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Aucune publication trouvée
            </h3>
            <p className="text-muted-foreground">
              {isAuthenticated
                ? "Cet utilisateur n'a pas encore publié de contenu."
                : "Connectez-vous pour voir plus de publications."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Publications ({totalCount})
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.05,
              ease: "easeOut",
            }}
          >
            <PostCard
              post={post}
              isBlurred={!isAuthenticated && !post.is_public}
              showActions={isAuthenticated}
              className="transform scale-95"
              isAuthenticated={isAuthenticated}
              profile={profile}
            />
          </motion.div>
        ))}

        {hasNextPage && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                "Voir plus"
              )}
            </Button>
          </div>
        )}

        {!hasNextPage && posts.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Vous avez vu toutes les publications
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
