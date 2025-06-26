/* eslint-disable prefer-const */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Comment, PaginatedResponse } from "@/lib/types";

const ITEMS_PER_PAGE = 20;

export async function fetchComments({
  postId,
  pageParam = 0,
  isAuthenticated = false,
}: {
  postId: string;
  pageParam?: number;
  isAuthenticated?: boolean;
}): Promise<PaginatedResponse<Comment>> {
  const supabase = isAuthenticated
    ? await createClient()
    : await createServiceClient();

  const startIndex = pageParam * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from("comments")
    .select(
      `
      *,
      user:users!comments_user_id_fkey(
        id,
        first_name,
        last_name,
        username,
        profile_picture_url,
        role
      ),
      user_vote:votes!votes_comment_id_fkey(vote_type),
      replies:comments!comments_parent_id_fkey(
        *,
        user:users!comments_user_id_fkey(
          id,
          first_name,
          last_name,
          username,
          profile_picture_url,
          role
        ),
        user_vote:votes!votes_comment_id_fkey(vote_type)
      )
    `,
      { count: "exact" }
    )
    .eq("post_id", postId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .range(startIndex, endIndex);

  const { data: comments, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Serialize the data for safe client transfer
  const serializedData = JSON.parse(JSON.stringify(comments || []));

  return {
    data: serializedData,
    count: count || 0,
    nextPage:
      count && (pageParam + 1) * ITEMS_PER_PAGE < count
        ? pageParam + 1
        : undefined,
  };
}

export async function createComment(commentData: {
  post_id: string;
  parent_id?: string;
  content: string;
  user_id: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .insert(commentData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return JSON.parse(JSON.stringify(data));
}

export async function voteComment(
  commentId: string,
  voteType: 1 | -1,
  userId: string
) {
  const supabase = await createClient();

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from("votes")
    .select("*")
    .eq("comment_id", commentId)
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
      comment_id: commentId,
      user_id: userId,
      vote_type: voteType,
    });

    if (error) throw new Error(error.message);
  }
}

export async function updateComment(id: string, content: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return JSON.parse(JSON.stringify(data));
}

export async function deleteComment(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("comments").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
