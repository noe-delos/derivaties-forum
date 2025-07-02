import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const cities = [
  "paris",
  "london",
  "new_york",
  "hong_kong",
  "singapore",
  "dubai",
  "frankfurt",
  "tokyo",
  "zurich",
  "toronto",
] as const;

async function assignRandomCities() {
  try {
    // Get all posts
    const { data: posts, error: fetchError } = await supabase
      .from("posts")
      .select("id");

    if (fetchError) throw fetchError;
    if (!posts) return;

    console.log(`Found ${posts.length} posts to update`);

    // Update each post with a random city
    for (const post of posts) {
      const randomCity = cities[Math.floor(Math.random() * cities.length)];

      const { error: updateError } = await supabase
        .from("posts")
        .update({ city: randomCity })
        .eq("id", post.id);

      if (updateError) {
        console.error(`Error updating post ${post.id}:`, updateError);
      }
    }

    console.log("Successfully assigned random cities to all posts");
  } catch (error) {
    console.error("Error assigning random cities:", error);
  }
}

assignRandomCities();
