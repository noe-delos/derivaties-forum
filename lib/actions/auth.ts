"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function signOutAction(): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    console.log("🔄 Starting server-side signout...");

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("❌ Supabase signout error:", error);
      return {
        success: false,
        error: "Erreur lors de la déconnexion",
      };
    }

    console.log("✅ Server-side signout successful");

    // Revalidate all pages to update the auth state
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Déconnexion réussie",
    };
  } catch (error) {
    console.error("💥 Signout action error:", error);
    return {
      success: false,
      error: "Erreur lors de la déconnexion",
    };
  }
}
