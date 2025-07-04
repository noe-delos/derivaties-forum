/* eslint-disable @typescript-eslint/no-unused-vars */
import { notFound } from "next/navigation";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";

import { PostCard } from "@/components/posts/post-card";
import { CorrectionsSection } from "@/components/corrections/corrections-section";
import { BackButton } from "@/components/ui/back-button";
import { fetchPost } from "@/lib/services/posts";
import { createClient } from "@/utils/supabase/server";
import { User as UserType } from "@/lib/types";

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let profile: UserType | null = null;
  const isAuthenticated = !!session?.user;

  // If user is authenticated, fetch their profile
  if (session?.user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    profile = data as UserType;
  }

  const queryClient = new QueryClient();

  try {
    // Prefetch the post
    await queryClient.prefetchQuery({
      queryKey: ["post", id, isAuthenticated],
      queryFn: () => fetchPost(id, isAuthenticated),
    });

    // Note: We're now using corrections instead of comments

    // Get the post data to check if it exists
    const post = await fetchPost(id, isAuthenticated);

    console.log(
      "&@@@@",
      isAuthenticated,
      profile,
      post,
      isAuthenticated && !post.is_public
    );
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="max-w-4xl space-y-2 pl-10">
          {/* Back Button */}
          <BackButton />

          {/* Post */}
          <PostCard
            post={post}
            isBlurred={!isAuthenticated && !post.is_public}
            showActions={isAuthenticated || post.is_public}
            expanded={true}
            isAuthenticated={isAuthenticated}
            profile={profile}
          />

          {/* Corrections */}
          <CorrectionsSection 
            post={post} 
            user={profile} 
            isAuthenticated={isAuthenticated} 
          />
        </div>
      </HydrationBoundary>
    );
  } catch (error) {
    notFound();
  }
}
