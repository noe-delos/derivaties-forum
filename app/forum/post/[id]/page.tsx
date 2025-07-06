/* eslint-disable @typescript-eslint/no-unused-vars */
import { notFound } from "next/navigation";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";

import { PostCard } from "@/components/posts/post-card";
import { CorrectionsSectionWrapper } from "@/components/corrections/corrections-section-wrapper";
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

  // Check if user has purchased this post
  let isPurchased = false;
  let isCorrectionPurchased = false;
  if (isAuthenticated && profile) {
    const { data: purchaseData } = await supabase
      .from("user_purchased_content")
      .select("id, content_type")
      .eq("user_id", profile.id)
      .eq("post_id", id);

    const purchases = purchaseData || [];
    isPurchased = purchases.some(p => p.content_type === "interview");
    isCorrectionPurchased = purchases.some(p => p.content_type === "correction");
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

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="max-w-4xl space-y-2 pl-10">
          {/* Back Button */}
          <BackButton />

          {/* Post */}
          <PostCard
            post={post}
            showActions={isAuthenticated || post.is_public}
            expanded={true}
            isAuthenticated={isAuthenticated}
            profile={profile}
            isPurchased={isPurchased}
          />

          {/* Corrections */}
          <CorrectionsSectionWrapper
            post={post}
            user={profile}
            isAuthenticated={isAuthenticated}
            isCorrectionPurchased={isCorrectionPurchased}
            userTokens={profile?.tokens || 0}
          />
        </div>
      </HydrationBoundary>
    );
  } catch (error) {
    notFound();
  }
}
