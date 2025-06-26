/* eslint-disable @typescript-eslint/no-unused-vars */
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchUserProfile } from "@/lib/services/profile";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfilePosts } from "@/components/profile/profile-posts";

interface ProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  try {
    const { userId } = await params;
    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthenticated = !!user;
    const isOwner = user?.id === userId;

    // Fetch user profile
    const profile = await fetchUserProfile(userId, isAuthenticated);

    if (!profile) {
      notFound();
    }

    return (
      <div className="max-w-5xl mx-auto space-y-6 pt-4">
        <ProfileHeader
          profile={profile}
          isOwner={isOwner}
          isAuthenticated={isAuthenticated}
        />

        <ProfilePosts userId={userId} initialPosts={profile.recentPosts} />
      </div>
    );
  } catch (error) {
    console.error("Profile page error:", error);
    notFound();
  }
}

export async function generateMetadata({ params }: ProfilePageProps) {
  try {
    const { userId } = await params;
    const serviceClient = await createServiceClient();

    const { data: user } = await serviceClient
      .from("users")
      .select("first_name, last_name, username, bio")
      .eq("id", userId)
      .single();

    if (!user) {
      return {
        title: "Profil introuvable",
        description: "Ce profil n'existe pas ou n'est plus disponible.",
      };
    }

    const displayName =
      user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.username || "Utilisateur";

    return {
      title: `${displayName} - Forum Finance`,
      description: user.bio || `Profil de ${displayName} sur le forum finance.`,
    };
  } catch (error) {
    return {
      title: "Profil - Forum Finance",
      description: "Profil utilisateur sur le forum finance.",
    };
  }
}
