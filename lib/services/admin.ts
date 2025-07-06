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
  totalCorrections: number;
  pendingCorrections: number;
  totalUpvotes: number;
  totalTokensAwarded: number;
  recentActivity: Array<{
    id: string;
    type: "post" | "comment" | "user";
    title: string;
    user: string;
    created_at: string;
  }>;
  weeklyStats: Array<{
    day: string;
    users: number;
    posts: number;
    comments: number;
  }>;
  categoryStats: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  cityStats: Array<{
    city: string;
    count: number;
    percentage: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  userGrowth: Array<{
    month: string;
    users: number;
    cumulative: number;
  }>;
  engagementStats: {
    averageCommentsPerPost: number;
    averageUpvotesPerPost: number;
    mostActiveUsers: Array<{
      user: string;
      posts: number;
      comments: number;
    }>;
  };
}

export async function fetchAdminStats(
  supabase: SupabaseClient
): Promise<AdminStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch basic counts
  const [
    { count: totalUsers },
    { count: totalPosts },
    { count: totalComments },
    { count: pendingPosts },
    { count: todayUsers },
    { count: todayPosts },
    { count: todayComments },
    { count: totalCorrections },
    { count: pendingCorrections },
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
    supabase.from("corrections").select("*", { count: "exact", head: true }),
    supabase
      .from("corrections")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  // Fetch additional metrics
  const [totalUpvotesResult, totalTokensResult] = await Promise.all([
    supabase
      .from("posts")
      .select("upvotes")
      .then(({ data }) => data?.reduce((sum, post) => sum + (post.upvotes || 0), 0) || 0),
    supabase
      .from("users")
      .select("tokens")
      .then(({ data }) => data?.reduce((sum, user) => sum + (user.tokens || 0), 0) || 0),
  ]);

  // Weekly stats for the last 7 days
  const weeklyStats = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      
      const [usersCount, postsCount, commentsCount] = await Promise.all([
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date.toISOString())
          .lt("created_at", nextDay.toISOString()),
        supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date.toISOString())
          .lt("created_at", nextDay.toISOString()),
        supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date.toISOString())
          .lt("created_at", nextDay.toISOString()),
      ]);

      return {
        day: dayName,
        users: usersCount.count || 0,
        posts: postsCount.count || 0,
        comments: commentsCount.count || 0,
      };
    })
  ).then(stats => stats.reverse());

  // Category distribution
  const { data: categoryData } = await supabase
    .from("posts")
    .select("category")
    .eq("status", "approved");
  
  const categoryStats = categoryData ? 
    Object.entries(
      categoryData.reduce((acc: any, post) => {
        acc[post.category] = (acc[post.category] || 0) + 1;
        return acc;
      }, {})
    ).map(([category, count]) => ({
      category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: count as number,
      percentage: Math.round(((count as number) / categoryData.length) * 100),
    })) : [];

  // City distribution
  const { data: cityData } = await supabase
    .from("posts")
    .select("city")
    .eq("status", "approved");
  
  const cityStats = cityData ? 
    Object.entries(
      cityData.reduce((acc: any, post) => {
        acc[post.city] = (acc[post.city] || 0) + 1;
        return acc;
      }, {})
    ).map(([city, count]) => ({
      city: city.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: count as number,
      percentage: Math.round(((count as number) / cityData.length) * 100),
    })) : [];

  // Status distribution
  const { data: statusData } = await supabase
    .from("posts")
    .select("status");
  
  const statusDistribution = statusData ? 
    Object.entries(
      statusData.reduce((acc: any, post) => {
        acc[post.status] = (acc[post.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({
      status: status === 'approved' ? 'Approuvé' : status === 'pending' ? 'En attente' : 'Rejeté',
      count: count as number,
      percentage: Math.round(((count as number) / statusData.length) * 100),
    })) : [];

  // User growth by month (last 12 months)
  const userGrowth = await Promise.all(
    Array.from({ length: 12 }, async (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      
      const [monthlyUsers, cumulativeUsers] = await Promise.all([
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date.toISOString())
          .lt("created_at", nextMonth.toISOString()),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .lt("created_at", nextMonth.toISOString()),
      ]);

      return {
        month: monthName,
        users: monthlyUsers.count || 0,
        cumulative: cumulativeUsers.count || 0,
      };
    })
  ).then(stats => stats.reverse());

  // Engagement stats
  const averageCommentsPerPost = totalComments && totalPosts ? 
    Math.round((totalComments / totalPosts) * 10) / 10 : 0;
  
  const averageUpvotesPerPost = totalUpvotesResult && totalPosts ? 
    Math.round((totalUpvotesResult / totalPosts) * 10) / 10 : 0;

  // Most active users
  const { data: userActivityData } = await supabase
    .from("users")
    .select(`
      id, first_name, last_name, username,
      posts:posts(count),
      comments:comments(count)
    `)
    .limit(5);

  const mostActiveUsers = userActivityData?.map((user: any) => ({
    user: user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : user.username || 'Utilisateur',
    posts: user.posts?.length || 0,
    comments: user.comments?.length || 0,
  })).sort((a, b) => (b.posts + b.comments) - (a.posts + a.comments)).slice(0, 5) || [];

  // Recent activity
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
    totalCorrections: totalCorrections || 0,
    pendingCorrections: pendingCorrections || 0,
    totalUpvotes: totalUpvotesResult,
    totalTokensAwarded: totalTokensResult,
    recentActivity,
    weeklyStats,
    categoryStats,
    cityStats,
    statusDistribution,
    userGrowth,
    engagementStats: {
      averageCommentsPerPost,
      averageUpvotesPerPost,
      mostActiveUsers,
    },
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
