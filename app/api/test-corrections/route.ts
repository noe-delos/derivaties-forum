import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { action, postId } = await request.json();
    const supabase = getAdminSupabaseClient();
    
    if (action === 'fetchCorrections') {
      // Test 1: Check if any corrections exist for this post
      const { data: allCorrections, error: allError } = await supabase
        .from("corrections")
        .select("*")
        .eq("post_id", postId);
        
      console.log("🔍 All corrections for post:", allCorrections);
      
      // Test 2: Try the same query structure as in posts.ts
      const { data: postWithCorrections, error: postError } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          corrected,
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
        `)
        .eq("id", postId)
        .single();
        
      console.log("🔍 Post with corrections query:", postWithCorrections);
      
      return NextResponse.json({
        success: true,
        allCorrections,
        postWithCorrections,
        errors: { allError, postError }
      });
    }
    
    if (action === 'createTestCorrection') {
      // Create a test correction
      const { data: correction, error } = await supabase
        .from("corrections")
        .insert([{
          post_id: postId,
          user_id: "76677c41-9272-4466-8625-c9392047fe0e", // Your user ID
          content: "Test correction content",
          status: 'approved',
          is_selected: true
        }])
        .select()
        .single();
        
      return NextResponse.json({
        success: true,
        correction,
        error
      });
    }
    
    return NextResponse.json({ error: "Invalid action" });
    
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json({ 
      error: "Test failed", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}