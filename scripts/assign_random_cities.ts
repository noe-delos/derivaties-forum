import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

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

    if (fetchError) {
      console.error("Error fetching posts:", fetchError);
      return;
    }

    if (!posts || posts.length === 0) {
      console.log("No posts found");
      return;
    }

    console.log(`Found ${posts.length} posts to update`);

    // Update posts in batches of 100
    const batchSize = 100;
    const batches = Math.ceil(posts.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, posts.length);
      const batch = posts.slice(start, end);

      const updates = batch.map((post) => ({
        id: post.id,
        city: cities[Math.floor(Math.random() * cities.length)],
      }));

      const { error: updateError } = await supabase
        .from("posts")
        .upsert(updates);

      if (updateError) {
        console.error(`Error updating batch ${i + 1}:`, updateError);
      } else {
        console.log(`Successfully updated batch ${i + 1} of ${batches}`);
      }
    }

    console.log("Successfully assigned random cities to all posts");
  } catch (error) {
    console.error("Error assigning random cities:", error);
  } finally {
    process.exit(0);
  }
}

assignRandomCities();
