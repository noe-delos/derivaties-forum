"use client";

import { createClient } from "@/utils/supabase/client";
import { useMemo } from "react";

export function useSupabase() {
  return useMemo(() => createClient(), []);
}
