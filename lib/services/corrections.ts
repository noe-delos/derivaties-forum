"use server";

import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { Correction } from "@/lib/types";

export interface CreateCorrectionData {
  post_id: string;
  content: string;
}

export interface UpdateCorrectionStatusData {
  status: 'approved' | 'rejected';
  moderator_note?: string;
  tokens_awarded?: number;
  is_selected?: boolean;
}

export async function createCorrection(data: CreateCorrectionData, isAuthenticated: boolean = false) {
  const supabase = getAdminSupabaseClient();
  
  const { data: correction, error } = await supabase
    .from("corrections")
    .insert([data])
    .select(`
      *,
      user:users!corrections_user_id_fkey(id, username, first_name, last_name, profile_picture_url),
      post:posts(id, title)
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return correction;
}

export async function getCorrectionsByPostId(postId: string, isAuthenticated: boolean = false) {
  const supabase = getAdminSupabaseClient();
  
  const { data: corrections, error } = await supabase
    .from("corrections")
    .select(`
      *,
      user:users!corrections_user_id_fkey(id, username, first_name, last_name, profile_picture_url),
      moderator:users!corrections_moderator_id_fkey(id, username, first_name, last_name)
    `)
    .eq("post_id", postId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return corrections as Correction[];
}

export async function getSelectedCorrectionForPost(postId: string, isAuthenticated: boolean = false) {
  const supabase = getAdminSupabaseClient();
  
  const { data: correction, error } = await supabase
    .from("corrections")
    .select(`
      *,
      user:users!corrections_user_id_fkey(id, username, first_name, last_name, profile_picture_url),
      moderator:users!corrections_moderator_id_fkey(id, username, first_name, last_name)
    `)
    .eq("post_id", postId)
    .eq("status", "approved")
    .eq("is_selected", true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return correction as Correction | null;
}

export async function getPendingCorrections(isAuthenticated: boolean = false) {
  const supabase = getAdminSupabaseClient();
  
  const { data: corrections, error } = await supabase
    .from("corrections")
    .select(`
      *,
      user:users!corrections_user_id_fkey(id, username, first_name, last_name, profile_picture_url),
      post:posts(id, title, category, type)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return corrections as Correction[];
}

export async function getCorrectionById(correctionId: string, isAuthenticated: boolean = false) {
  const supabase = getAdminSupabaseClient();
  
  const { data: correction, error } = await supabase
    .from("corrections")
    .select(`
      *,
      user:users!corrections_user_id_fkey(id, username, first_name, last_name, profile_picture_url),
      post:posts(id, title, content, category, type),
      moderator:users!corrections_moderator_id_fkey(id, username, first_name, last_name)
    `)
    .eq("id", correctionId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return correction as Correction;
}

export async function updateCorrectionStatus(
  correctionId: string, 
  data: UpdateCorrectionStatusData,
  moderatorId: string,
  isAuthenticated: boolean = false
) {
  const supabase = getAdminSupabaseClient();
  
  const { data: correction, error } = await supabase
    .from("corrections")
    .update({
      ...data,
      moderator_id: moderatorId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", correctionId)
    .select(`
      *,
      user:users!corrections_user_id_fkey(id, username, first_name, last_name, profile_picture_url),
      post:posts(id, title),
      moderator:users!corrections_moderator_id_fkey(id, username, first_name, last_name)
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return correction;
}

export async function getUserCorrections(userId: string, isAuthenticated: boolean = false) {
  const supabase = getAdminSupabaseClient();
  
  const { data: corrections, error } = await supabase
    .from("corrections")
    .select(`
      *,
      post:posts(id, title, category, type),
      moderator:users!corrections_moderator_id_fkey(id, username, first_name, last_name)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return corrections as Correction[];
}

export async function deletePendingCorrection(correctionId: string, userId: string, isAuthenticated: boolean = false) {
  const supabase = getAdminSupabaseClient();
  
  const { error } = await supabase
    .from("corrections")
    .delete()
    .eq("id", correctionId)
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function getCorrectionStats() {
  const supabase = getAdminSupabaseClient();
  
  const { data: stats, error }: any = await supabase
    .from("corrections")
    .select("status")
    .then(({ data, error }) => {
      if (error) throw error;
      
      const pending = data?.filter(c => c.status === 'pending').length || 0;
      const approved = data?.filter(c => c.status === 'approved').length || 0;
      const rejected = data?.filter(c => c.status === 'rejected').length || 0;
      
      return {
        data: { pending, approved, rejected, total: data?.length || 0 },
        error: null
      };
    });

  if (error) {
    throw new Error(error.message);
  }

  return stats;
}