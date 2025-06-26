import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatePostForm } from "@/components/posts/create-post-form";

export default async function CreatePostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Créer une publication</h1>
        <p className="text-muted-foreground">
          Partagez votre expérience ou posez une question à la communauté
        </p>
      </div>

      <CreatePostForm userId={user.id} />
    </div>
  );
}
