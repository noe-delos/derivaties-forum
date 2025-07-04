"use server";

import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { Notification } from "@/lib/types";

export async function getUserNotifications(userId: string, limit: number = 20) {
  const supabase = getAdminSupabaseClient();
  
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(`
      *,
      post:posts(id, title)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return notifications as Notification[];
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = getAdminSupabaseClient();
  
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const supabase = getAdminSupabaseClient();
  
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = getAdminSupabaseClient();
  
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function deleteNotification(notificationId: string, userId: string) {
  const supabase = getAdminSupabaseClient();
  
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}