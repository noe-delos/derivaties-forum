/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import { Post, User, Comment, PostStatus } from "@/lib/types";

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  pendingPosts: number;
  todayUsers: number;
  todayPosts: number;
  todayComments: number;
  recentActivity: Array<{
    id: string;
    type: "post" | "comment" | "user";
    title: string;
    user: string;
    created_at: string;
  }>;
}

export async function fetchAdminStats(
  supabase: SupabaseClient
): Promise<AdminStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch total counts
  const [
    { count: totalUsers },
    { count: totalPosts },
    { count: totalComments },
    { count: pendingPosts },
    { count: todayUsers },
    { count: todayPosts },
    { count: todayComments },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
  ]);

  // Fetch recent activity
  const { data: recentPosts } = await supabase
    .from("posts")
    .select(
      "id, title, created_at, user:users(first_name, last_name, username)"
    )
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentComments } = await supabase
    .from("comments")
    .select(
      "id, content, created_at, user:users(first_name, last_name, username), post:posts(title)"
    )
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentUsers } = await supabase
    .from("users")
    .select("id, first_name, last_name, username, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Combine and format recent activity
  const recentActivity = [
    ...(recentPosts?.map((post: any) => ({
      id: post.id,
      type: "post" as const,
      title: post.title,
      user:
        post.user?.first_name && post.user?.last_name
          ? `${post.user.first_name} ${post.user.last_name}`
          : post.user?.username || "Utilisateur",
      created_at: post.created_at,
    })) || []),
    ...(recentComments?.map((comment: any) => ({
      id: comment.id,
      type: "comment" as const,
      title: `Commentaire sur "${comment.post?.title}"`,
      user:
        comment.user?.first_name && comment.user?.last_name
          ? `${comment.user.first_name} ${comment.user.last_name}`
          : comment.user?.username || "Utilisateur",
      created_at: comment.created_at,
    })) || []),
    ...(recentUsers?.map((user: any) => ({
      id: user.id,
      type: "user" as const,
      title: "Nouvel utilisateur",
      user:
        user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.username || "Utilisateur",
      created_at: user.created_at,
    })) || []),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  return {
    totalUsers: totalUsers || 0,
    totalPosts: totalPosts || 0,
    totalComments: totalComments || 0,
    pendingPosts: pendingPosts || 0,
    todayUsers: todayUsers || 0,
    todayPosts: todayPosts || 0,
    todayComments: todayComments || 0,
    recentActivity,
  };
}

export async function fetchPendingPosts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      user:users(id, first_name, last_name, username, email, profile_picture_url)
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Serialize data to avoid hydration issues
  return JSON.parse(JSON.stringify(data));
}

export async function updatePostStatus(
  supabase: SupabaseClient,
  postId: string,
  status: PostStatus,
  moderatorNote?: string
) {
  const { data, error } = await supabase
    .from("posts")
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(moderatorNote && { moderator_note: moderatorNote }),
    })
    .eq("id", postId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAllUsers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return JSON.parse(JSON.stringify(data));
}

export async function updateUserRole(
  supabase: SupabaseClient,
  userId: string,
  role: "user" | "moderator" | "admin"
) {
  const { data, error } = await supabase
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function banUser(
  supabase: SupabaseClient,
  userId: string,
  banned: boolean
) {
  const { data, error } = await supabase
    .from("users")
    .update({ is_banned: banned, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAllComments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      user:users(id, first_name, last_name, username, profile_picture_url),
      post:posts(id, title)
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return JSON.parse(JSON.stringify(data));
}

export async function deleteComment(
  supabase: SupabaseClient,
  commentId: string
) {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
}
