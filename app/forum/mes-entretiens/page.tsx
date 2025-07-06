import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BackButton } from "@/components/ui/back-button";
import { PostCard } from "@/components/posts/post-card";
import { PostSkeleton } from "@/components/posts/post-skeleton";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Mes entretiens | BridgeYou Forum",
  description: "Consultez tous vos entretiens achetés avec des tokens",
};

async function PurchasedInterviews() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get user's purchased content
  const { data: purchasedContent, error: purchaseError } = await supabase
    .from("user_purchased_content")
    .select(`
      id,
      content_type,
      tokens_spent,
      created_at,
      post_id,
      posts (
        *,
        user:users!posts_user_id_fkey(
          id,
          first_name,
          last_name,
          username,
          profile_picture_url,
          role
        ),
        bank:banks!posts_bank_id_fkey(
          id,
          name,
          logo_url
        ),
        media:post_media(*),
        selected_correction:corrections!corrections_post_id_fkey(
          id,
          content,
          status,
          is_selected,
          tokens_awarded,
          created_at,
          user:users!corrections_user_id_fkey(
            id,
            username,
            first_name,
            last_name,
            profile_picture_url,
            role
          )
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (purchaseError) {
    console.error("Error fetching purchased content:", purchaseError);
    return <div>Error loading purchased content</div>;
  }

  // Group by interview vs correction
  const interviews = purchasedContent?.filter(p => p.content_type === "interview") || [];
  const corrections = purchasedContent?.filter(p => p.content_type === "correction") || [];

  if (!purchasedContent || purchasedContent.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-4">
        <div className="text-center space-y-3">
          <Icon icon="majesticons:coins" className="h-16 w-16 text-amber-500 mx-auto" />
          <h2 className="text-2xl font-semibold">Aucun entretien acheté</h2>
          <p className="text-muted-foreground max-w-md">
            Vous n'avez pas encore acheté d'entretiens avec vos tokens. 
            Explorez le forum pour découvrir du contenu premium.
          </p>
          <Badge variant="secondary" className="gap-2">
            <Icon icon="majesticons:coins" className="h-4 w-4" />
            Entretien: 5 tokens • Correction: 10 tokens
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Interviews Section */}
      {interviews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Icon icon="solar:dialog-bold" className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Entretiens achetés</h2>
            <Badge variant="secondary">{interviews.length}</Badge>
          </div>
          <div className="grid gap-6">
            {interviews.map((purchase) => (
              <div key={purchase.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Acheté le {new Date(purchase.created_at).toLocaleDateString("fr-FR")}</span>
                  <Badge variant="outline" className="gap-1">
                    <Icon icon="majesticons:coins" className="h-3 w-3" />
                    {purchase.tokens_spent} tokens
                  </Badge>
                </div>
                <PostCard 
                  post={purchase.posts as any} 
                  showActions={false}
                  isPurchased={true}
                  isAuthenticated={true}
                  profile={profile}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corrections Section */}
      {corrections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Icon icon="mdi:check-circle" className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold">Corrections achetées</h2>
            <Badge variant="secondary">{corrections.length}</Badge>
          </div>
          <div className="grid gap-6">
            {corrections.map((purchase) => (
              <div key={purchase.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Acheté le {new Date(purchase.created_at).toLocaleDateString("fr-FR")}</span>
                  <Badge variant="outline" className="gap-1">
                    <Icon icon="majesticons:coins" className="h-3 w-3" />
                    {purchase.tokens_spent} tokens
                  </Badge>
                </div>
                <PostCard 
                  post={purchase.posts as any} 
                  showActions={false}
                  isPurchased={true}
                  isAuthenticated={true}
                  profile={profile}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MesEntretiensPage() {
  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-3">
          <BackButton />
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Icon icon="majesticons:coins" className="h-8 w-8 text-amber-600" />
              <h1 className="text-3xl font-bold">Mes entretiens</h1>
            </div>
            <p className="text-muted-foreground">
              Retrouvez tous les entretiens et corrections que vous avez achetés avec vos tokens.
            </p>
          </div>
        </div>

        {/* Content */}
        <Suspense fallback={
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        }>
          <PurchasedInterviews />
        </Suspense>
      </div>
    </div>
  );
}