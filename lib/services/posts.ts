"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  Post,
  PostCategory,
  PostType,
  SearchFilters,
  PaginatedResponse,
} from "@/lib/types";
import { getAdminSupabaseClient } from "../supabase/admin";

const ITEMS_PER_PAGE = 10;

export async function fetchPosts({
  pageParam = 0,
  category,
  filters,
  isAuthenticated = false,
}: {
  pageParam?: number;
  category?: PostCategory;
  filters?: SearchFilters;
  isAuthenticated?: boolean;
}): Promise<PaginatedResponse<Post>> {
  // Use admin client to ensure we can fetch corrections regardless of RLS
  const supabase = getAdminSupabaseClient();

  const startIndex = pageParam * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE - 1;

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
      bank:banks!posts_bank_id_fkey(
        id,
        name,
        logo_url
      ),
      media:post_media(*),
      user_vote:votes!votes_post_id_fkey(vote_type),
      selected_correction:corrections!corrections_post_id_fkey(
        id,
        content,
        status,
        is_selected,
        tokens_awarded,
        created_at,
        user:users!corrections_user_id_fkey(
          id,
          username,
          first_name,
          last_name,
          profile_picture_url,
          role
        )
      )
    `,
      { count: "exact" }
    )
    .eq("status", "approved");

  // Apply sorting
  if (filters?.sortBy === "popular") {
    query = query.order("upvotes", { ascending: false });
  } else if (filters?.sortBy === "comments") {
    query = query.order("comments_count", { ascending: false });
  } else {
    // Default to recent
    query = query.order("created_at", { ascending: false });
  }

  // If not authenticated, only show public posts
  if (!isAuthenticated) {
    query = query.eq("is_public", true);
  }

  // Apply category filter
  if (category) {
    query = query.eq("category", category);
  }

  // Apply other filters
  if (filters) {
    if (filters.type) {
      query = query.eq("type", filters.type);
    }
    if (filters.banks && filters.banks.length > 0) {
      query = query.in("bank_id", filters.banks);
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps("tags", filters.tags);
    }
    if (filters.date_from) {
      query = query.gte("created_at", filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte("created_at", filters.date_to);
    }
  }

  query = query.range(startIndex, endIndex);

  const { data: posts, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Serialize the data to ensure it can be passed to client components
  // This converts Date objects to strings and ensures serialization compatibility

  console.log("🔍 @@@@@@@@", posts);
  const serializedData = JSON.parse(JSON.stringify(posts));

  return {
    data: serializedData,
    count: count || 0,
    nextPage:
      count && (pageParam + 1) * ITEMS_PER_PAGE < count
        ? pageParam + 1
        : undefined,
  };
}

export async function fetchPost(
  id: string,
  isAuthenticated = false
): Promise<Post> {
  // Use admin client to ensure we can fetch corrections regardless of RLS
  const supabase = getAdminSupabaseClient();

  let postQuery = supabase
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
      bank:banks!posts_bank_id_fkey(
        id,
        name,
        logo_url
      ),
      media:post_media(*),
      user_vote:votes!votes_post_id_fkey(vote_type),
      selected_correction:corrections!corrections_post_id_fkey(
        id,
        content,
        status,
        is_selected,
        tokens_awarded,
        created_at,
        user:users!corrections_user_id_fkey(
          id,
          username,
          first_name,
          last_name,
          profile_picture_url,
          role
        )
      )
    `
    )
    .eq("id", id)
    .eq("status", "approved");

  // If not authenticated, only show public posts
  if (!isAuthenticated) {
    postQuery = postQuery.eq("is_public", true);
  }

  const { data: post, error } = await postQuery.single();

  console.log("🔍 fetchPost - Post query result:", { post, error });
  console.log(
    "🔍 fetchPost - Selected corrections:",
    post?.selected_correction
  );

  if (error) {
    throw new Error(error.message);
  }

  // Process post to add corrected flag based on approved corrections
  const processedPost = {
    ...post,
    corrected:
      post.selected_correction &&
      post.selected_correction.some((c: any) => c.status === "approved"),
  };

  // Serialize the data for safe client transfer
  return JSON.parse(JSON.stringify(processedPost));
}

export async function searchPosts({
  query,
  filters,
  pageParam = 0,
  isAuthenticated = false,
}: {
  query: string;
  filters?: SearchFilters;
  pageParam?: number;
  isAuthenticated?: boolean;
}): Promise<PaginatedResponse<Post>> {
  // Use admin client to ensure we can fetch corrections regardless of RLS
  const supabase = getAdminSupabaseClient();

  const startIndex = pageParam * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE - 1;

  let dbQuery = supabase
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
      bank:banks!posts_bank_id_fkey(
        id,
        name,
        logo_url
      ),
      media:post_media(*),
      user_vote:votes!votes_post_id_fkey(vote_type),
      selected_correction:corrections!corrections_post_id_fkey(
        id,
        content,
        status,
        is_selected,
        tokens_awarded,
        created_at,
        user:users!corrections_user_id_fkey(
          id,
          username,
          first_name,
          last_name,
          profile_picture_url,
          role
        )
      )
    `,
      { count: "exact" }
    )
    .eq("status", "approved")
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
    .order("created_at", { ascending: false });

  // If not authenticated, only show public posts
  if (!isAuthenticated) {
    dbQuery = dbQuery.eq("is_public", true);
  }

  // Apply filters
  if (filters) {
    if (filters.category) {
      dbQuery = dbQuery.eq("category", filters.category);
    }
    if (filters.type) {
      dbQuery = dbQuery.eq("type", filters.type);
    }
    if (filters.banks && filters.banks.length > 0) {
      dbQuery = dbQuery.in("bank_id", filters.banks);
    }
    if (filters.tags && filters.tags.length > 0) {
      dbQuery = dbQuery.overlaps("tags", filters.tags);
    }
  }

  dbQuery = dbQuery.range(startIndex, endIndex);

  const { data: posts, error, count } = await dbQuery;

  if (error) {
    throw new Error(error.message);
  }

  // Process posts to add corrected flag based on approved corrections
  const processedPosts = (posts || []).map((post) => ({
    ...post,
    corrected:
      post.selected_correction &&
      post.selected_correction.some((c: any) => c.status === "approved"),
  }));

  // Serialize the data for safe client transfer
  const serializedData = JSON.parse(JSON.stringify(processedPosts));

  return {
    data: serializedData,
    count: count || 0,
    nextPage:
      count && (pageParam + 1) * ITEMS_PER_PAGE < count
        ? pageParam + 1
        : undefined,
  };
}

export async function createPost(postData: {
  title: string;
  content: string;
  category: PostCategory;
  type: PostType;
  bank_id: string;
  tags: string[];
  is_public: boolean;
  user_id: string;
  city: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      ...postData,
      city: postData.city || 'paris',
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Serialize the data to ensure it can be passed to client components
  return JSON.parse(JSON.stringify(data));
}

export async function addPostMedia(
  postId: string,
  mediaInfo: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>
) {
  const supabase = await createClient();

  const mediaRecords = mediaInfo.map((media, index) => ({
    post_id: postId,
    file_url: media.url,
    file_name: media.name,
    file_type: media.type.startsWith("image/")
      ? "image"
      : media.type.startsWith("video/")
      ? "video"
      : "document",
    file_size: media.size,
    display_order: index,
  }));

  const { error } = await supabase.from("post_media").insert(mediaRecords);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updatePost(id: string, updates: Partial<Post>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Serialize the data to ensure it can be passed to client components
  return JSON.parse(JSON.stringify(data));
}

export async function deletePost(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function votePost(
  postId: string,
  voteType: 1 | -1,
  userId: string
) {
  const supabase = await createClient();

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Remove vote if same vote type
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("id", existingVote.id);

      if (error) throw new Error(error.message);
    } else {
      // Update vote if different vote type
      const { error } = await supabase
        .from("votes")
        .update({ vote_type: voteType })
        .eq("id", existingVote.id);

      if (error) throw new Error(error.message);
    }
  } else {
    // Create new vote
    const { error } = await supabase.from("votes").insert({
      post_id: postId,
      user_id: userId,
      vote_type: voteType,
    });

    if (error) throw new Error(error.message);
  }
}
