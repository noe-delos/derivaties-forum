/* eslint-disable @typescript-eslint/no-unused-vars */
import { notFound } from "next/navigation";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";

import { PostCard } from "@/components/posts/post-card";
import { CommentList } from "@/components/comments/comment-list";
import { fetchPost } from "@/lib/services/posts";
import { fetchComments } from "@/lib/services/comments";
import { createClient } from "@/lib/supabase/server";

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  const queryClient = new QueryClient();

  try {
    // Prefetch the post
    await queryClient.prefetchQuery({
      queryKey: ["post", id, isAuthenticated],
      queryFn: () => fetchPost(id, isAuthenticated),
    });

    // Prefetch the first page of comments
    await queryClient.prefetchInfiniteQuery({
      queryKey: ["comments", id, isAuthenticated],
      queryFn: ({ pageParam = 0 }) =>
        fetchComments({
          postId: id,
          pageParam,
          isAuthenticated,
        }),
      initialPageParam: 0,
    });

    // Get the post data to check if it exists
    const post = await fetchPost(id, isAuthenticated);

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Post */}
          <PostCard
            post={post}
            isBlurred={!isAuthenticated && !post.is_public}
            showActions={isAuthenticated || post.is_public}
            expanded={true}
          />

          {/* Comments */}
          <CommentList postId={id} />
        </div>
      </HydrationBoundary>
    );
  } catch (error) {
    notFound();
  }
}
