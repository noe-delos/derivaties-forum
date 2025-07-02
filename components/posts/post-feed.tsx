import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PostCard } from "./post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabase } from "@/hooks/use-supabase";

export function PostFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const supabase = useSupabase();

  const category = searchParams.get("category");
  const city = searchParams.get("city");
  const type = searchParams.get("type");

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        let query = supabase
          .from("posts")
          .select(
            `
            id,
            title,
            content,
            category,
            type,
            city,
            created_at,
            upvotes,
            comments_count,
            user:users (
              first_name,
              last_name
            )
            `
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (category) {
          query = query.eq("category", category);
        }

        if (city) {
          query = query.eq("city", city);
        }

        if (type) {
          query = query.eq("type", type);
        }

        const { data, error } = await query;

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [supabase, category, city, type]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Aucune publication trouvée
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos filtres ou revenez plus tard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
