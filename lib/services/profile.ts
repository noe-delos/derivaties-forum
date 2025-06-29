"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { User, Post, PaginatedResponse } from "@/lib/types";
import { getAdminSupabaseClient } from "../supabase/admin";

export interface UserProfileStats {
  postsCount: number;
  commentsCount: number;
  totalUpvotes: number;
  totalDownvotes: number;
  approvedPosts: number;
  pendingPosts: number;
  rejectedPosts: number;
}

export interface UserProfile extends User {
  stats: UserProfileStats;
  recentPosts: Post[];
}

export async function fetchUserProfile(
  userId: string,
  isAuthenticated = false
): Promise<UserProfile> {
  const supabase = getAdminSupabaseClient();

  // Fetch user basic info
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (userError) {
    throw new Error(userError.message);
  }

  // Fetch user statistics
  const [postsResult, commentsResult, votesResult] = await Promise.all([
    // Posts count by status
    supabase
      .from("posts")
      .select("status", { count: "exact" })
      .eq("user_id", userId),

    // Comments count
    supabase
      .from("comments")
      .select("id", { count: "exact" })
      .eq("user_id", userId),

    // Total upvotes/downvotes received on user's posts
    supabase.from("posts").select("upvotes, downvotes").eq("user_id", userId),
  ]);

  if (postsResult.error || commentsResult.error || votesResult.error) {
    throw new Error("Error fetching user statistics");
  }

  // Calculate statistics
  const allPosts = postsResult.data || [];
  const postsCount = postsResult.count || 0;
  const commentsCount = commentsResult.count || 0;

  const approvedPosts = allPosts.filter((p) => p.status === "approved").length;
  const pendingPosts = allPosts.filter((p) => p.status === "pending").length;
  const rejectedPosts = allPosts.filter((p) => p.status === "rejected").length;

  const totalUpvotes = (votesResult.data || []).reduce(
    (sum, post) => sum + (post.upvotes || 0),
    0
  );
  const totalDownvotes = (votesResult.data || []).reduce(
    (sum, post) => sum + (post.downvotes || 0),
    0
  );

  // Fetch recent posts (only approved posts, public if not authenticated)
  let recentPostsQuery = supabase
    .from("posts")
    .select(
      `
      *,
      user:users!posts_user_id_fkey(
        id,
        first_name,
        last_name,
        username,
        profile_picture_url,
        role
      ),
      media:post_media(*)
    `
    )
    .eq("user_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(5);

  // If not authenticated, only show public posts
  if (!isAuthenticated) {
    recentPostsQuery = recentPostsQuery.eq("is_public", true);
  }

  const { data: recentPosts, error: postsError } = await recentPostsQuery;

  if (postsError) {
    throw new Error(postsError.message);
  }

  // If authenticated, fetch user votes for recent posts
  let recentPostsWithVotes = recentPosts || [];

  if (isAuthenticated && recentPosts && recentPosts.length > 0) {
    const postIds = recentPosts.map((post) => post.id);

    // Get current user's votes on these posts
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser) {
      const { data: userVotes } = await supabase
        .from("votes")
        .select("post_id, vote_type")
        .in("post_id", postIds)
        .eq("user_id", currentUser.id);

      // Add user votes to posts
      recentPostsWithVotes = recentPosts.map((post) => ({
        ...post,
        user_vote: userVotes?.find((vote) => vote.post_id === post.id) || null,
      }));
    }
  }

  const stats: UserProfileStats = {
    postsCount,
    commentsCount,
    totalUpvotes,
    totalDownvotes,
    approvedPosts,
    pendingPosts,
    rejectedPosts,
  };

  // Serialize the data for safe client transfer
  return JSON.parse(
    JSON.stringify({
      ...user,
      stats,
      recentPosts: recentPostsWithVotes,
    })
  );
}

export async function fetchUserPosts({
  userId,
  pageParam = 0,
  isAuthenticated = false,
}: {
  userId: string;
  pageParam?: number;
  isAuthenticated?: boolean;
}): Promise<PaginatedResponse<Post>> {
  const supabase = isAuthenticated
    ? await createClient()
    : await createServiceClient();

  const ITEMS_PER_PAGE = 10;
  const startIndex = pageParam * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE - 1;

  try {
    let query = supabase
      .from("posts")
      .select(
        `
        *,
        user:users!posts_user_id_fkey(
          id,
          first_name,
          last_name,
          username,
          profile_picture_url,
          role
        ),
        media:post_media(*)
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .range(startIndex, endIndex);

    // If not authenticated, only show public posts
    if (!isAuthenticated) {
      query = query.eq("is_public", true);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error("Error fetching user posts:", error);
      throw new Error(error.message);
    }

    // If authenticated, fetch user votes for these posts
    let postsWithVotes = posts || [];

    if (isAuthenticated && posts && posts.length > 0) {
      const postIds = posts.map((post) => post.id);

      // Get current user's votes on these posts
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        const { data: userVotes } = await supabase
          .from("votes")
          .select("post_id, vote_type")
          .in("post_id", postIds)
          .eq("user_id", currentUser.id);

        // Add user votes to posts
        postsWithVotes = posts.map((post) => ({
          ...post,
          user_vote:
            userVotes?.find((vote) => vote.post_id === post.id) || null,
        }));
      }
    }

    // Serialize the data for safe client transfer
    const serializedData = JSON.parse(JSON.stringify(postsWithVotes));

    return {
      data: serializedData,
      count: count || 0,
      nextPage:
        count && (pageParam + 1) * ITEMS_PER_PAGE < count
          ? pageParam + 1
          : undefined,
    };
  } catch (error) {
    console.error("fetchUserPosts error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch user posts"
    );
  }
}

export async function updateUserProfile(
  userId: string,
  updates: {
    first_name?: string;
    last_name?: string;
    username?: string;
    bio?: string;
    job_title?: string;
    location?: string;
    school?: string;
  }
): Promise<User> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function uploadProfilePicture(
  userId: string,
  file: File
): Promise<string> {
  const supabase = await createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/profile.${fileExt}`;

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from("profile-pictures")
    .upload(fileName, file, {
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  // Get public URL
  const { data } = supabase.storage
    .from("profile-pictures")
    .getPublicUrl(fileName);

  // Update user record with new profile picture URL
  const { error: updateError } = await supabase
    .from("users")
    .update({ profile_picture_url: data.publicUrl })
    .eq("id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return data.publicUrl;
}

export async function uploadBannerImage(
  userId: string,
  file: File
): Promise<string> {
  const supabase = await createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/banner.${fileExt}`;

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from("profile-pictures")
    .upload(fileName, file, {
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  // Get public URL
  const { data } = supabase.storage
    .from("profile-pictures")
    .getPublicUrl(fileName);

  // Update user record with new banner URL
  const { error: updateError } = await supabase
    .from("users")
    .update({ banner_url: data.publicUrl })
    .eq("id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return data.publicUrl;
}
