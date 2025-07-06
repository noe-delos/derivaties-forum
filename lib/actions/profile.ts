"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  updateUserProfile,
  uploadProfilePicture,
  uploadBannerImage,
} from "@/lib/services/profile";

export interface UpdateProfileActionData {
  first_name?: string;
  last_name?: string;
  username?: string;
  bio?: string;
  job_title?: string;
  location?: string;
  school?: string;
  profile_picture?: File | null;
  banner?: File | null;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export async function updateProfileAction(
  data: UpdateProfileActionData
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Non authentifié",
      };
    }

    console.log("🔄 Updating profile for user:", user.id);
    console.log("📋 Profile data:", data);

    // Check if username is already taken (if provided and different)
    if (data.username) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", data.username)
        .neq("id", user.id)
        .single();

      if (existingUser) {
        return {
          success: false,
          error: "Ce nom d'utilisateur est déjà pris",
        };
      }
    }

    // Prepare update data (exclude files)
    const profileUpdates: any = {};
    if (data.first_name !== undefined)
      profileUpdates.first_name = data.first_name || null;
    if (data.last_name !== undefined)
      profileUpdates.last_name = data.last_name || null;
    if (data.username !== undefined)
      profileUpdates.username = data.username || null;
    if (data.bio !== undefined) profileUpdates.bio = data.bio || null;
    if (data.job_title !== undefined)
      profileUpdates.job_title = data.job_title || null;
    if (data.location !== undefined)
      profileUpdates.location = data.location || null;
    if (data.school !== undefined) profileUpdates.school = data.school || null;

    console.log("📝 Profile updates:", profileUpdates);

    // Handle file uploads
    let profilePictureUrl: string | undefined;
    let bannerUrl: string | undefined;

    if (data.profile_picture && data.profile_picture.size > 0) {
      console.log("📸 Uploading profile picture...");
      try {
        profilePictureUrl = await uploadProfilePicture(
          user.id,
          data.profile_picture
        );
        console.log("✅ Profile picture uploaded:", profilePictureUrl);
      } catch (error) {
        console.error("❌ Profile picture upload failed:", error);
        return {
          success: false,
          error: "Erreur lors du téléchargement de la photo de profil",
        };
      }
    }

    if (data.banner && data.banner.size > 0) {
      console.log("🖼️ Uploading banner...");
      try {
        bannerUrl = await uploadBannerImage(user.id, data.banner);
        console.log("✅ Banner uploaded:", bannerUrl);
      } catch (error) {
        console.error("❌ Banner upload failed:", error);
        return {
          success: false,
          error: "Erreur lors du téléchargement de la bannière",
        };
      }
    }

    // Update profile in database
    if (
      Object.keys(profileUpdates).length > 0 ||
      profilePictureUrl ||
      bannerUrl
    ) {
      const finalUpdates = {
        ...profileUpdates,
      };

      if (profilePictureUrl) {
        finalUpdates.profile_picture_url = profilePictureUrl;
      }
      if (bannerUrl) {
        finalUpdates.banner_url = bannerUrl;
      }

      console.log("💾 Final database updates:", finalUpdates);

      const updatedProfile = await updateUserProfile(user.id, finalUpdates);
      console.log("✅ Profile updated successfully:", updatedProfile);
    }

    // Revalidate relevant pages
    revalidatePath("/profile");
    revalidatePath(`/profile/${user.id}`);

    return {
      success: true,
      message: "Profil mis à jour avec succès!",
    };
  } catch (error) {
    console.error("💥 Update profile action error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour du profil",
    };
  }
}
