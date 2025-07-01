"use server";

import { getAdminSupabaseClient } from "../supabase/admin";
import { Bank } from "@/lib/types";

export async function fetchBanks(): Promise<Bank[]> {
  const supabase = getAdminSupabaseClient();

  const { data: banks, error } = await supabase
    .from("banks")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching banks:", error);
    throw new Error(error.message);
  }

  return banks || [];
}

export async function getBankById(id: string): Promise<Bank | null> {
  const supabase = getAdminSupabaseClient();

  const { data: bank, error } = await supabase
    .from("banks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching bank:", error);
    return null;
  }

  return bank;
}
