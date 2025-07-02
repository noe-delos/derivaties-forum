/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createPost, addPostMedia } from "@/lib/services/posts";
import { PostCategory, PostType } from "@/lib/types";
import type { UploadResult } from "@/lib/services/uploadService";
import { createServiceClient } from "@/lib/supabase/server";
import { getAdminSupabaseClient } from "../supabase/admin";

interface CreatePostData {
  title: string;
  content: string;
  category: PostCategory;
  type: PostType;
  bank_id: string;
  tags: string[];
  is_public: boolean;
  userId: string;
  city: string;
  mediaFiles?: UploadResult[];
  documentFiles?: UploadResult[];
}

interface MediaFile {
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

type BucketName = "post-media" | "post-files";

export async function createPostAction(data: CreatePostData) {
  console.log("🚀 Server Action: Starting post creation...", {
    title: data.title,
    category: data.category,
    type: data.type,
    tags: data.tags,
    is_public: data.is_public,
    userId: data.userId,
    mediaFilesCount: data.mediaFiles?.length || 0,
    documentFilesCount: data.documentFiles?.length || 0,
  });

  try {
    // Validate content
    const textContent = data.content.replace(/<[^>]*>/g, "").trim();
    if (!data.content || textContent.length < 10) {
      console.log("❌ Server Action: Content validation failed");
      throw new Error("Le contenu doit contenir au moins 10 caractères");
    }

    // Prepare media data from pre-uploaded files
    const uploadedMedia: Array<{
      url: string;
      name: string;
      size: number;
      type: string;
    }> = [];

    // Add media files
    if (data.mediaFiles && data.mediaFiles.length > 0) {
      console.log("🖼️ Server Action: Processing media files...");
      for (const file of data.mediaFiles) {
        uploadedMedia.push({
          url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${file.path}`,
          name: file.path.split("/").pop() || file.path,
          size: file.size,
          type: file.type,
        });
      }
    }

    // Add document files
    if (data.documentFiles && data.documentFiles.length > 0) {
      console.log("📄 Server Action: Processing document files...");
      for (const file of data.documentFiles) {
        uploadedMedia.push({
          url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${file.path}`,
          name: file.path.split("/").pop() || file.path,
          size: file.size,
          type: file.type,
        });
      }
    }

    console.log("✅ Server Action: All files processed:", uploadedMedia);

    // Create the post
    console.log("💾 Server Action: Creating post in database...");
    const createdPost = await createPost({
      title: data.title,
      content: data.content,
      category: data.category,
      type: data.type,
      bank_id: data.bank_id,
      tags: data.tags,
      is_public: data.is_public,
      user_id: data.userId,
    });

    console.log("✅ Server Action: Post created successfully:", createdPost.id);

    // Add media to the post if there are any uploaded files
    if (uploadedMedia.length > 0) {
      console.log("🔗 Server Action: Adding media to post...");
      await addPostMedia(createdPost.id, uploadedMedia);
      console.log("✅ Server Action: Media added successfully");
    }

    console.log("🎉 Server Action: Post creation completed successfully!");

    // Revalidate the posts pages
    revalidatePath("/");
    revalidatePath("/create");

    return {
      success: true,
      postId: createdPost.id,
      message: "Publication créée avec succès!",
    };
  } catch (error) {
    console.error("💥 Server Action Error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

export async function createPostServer(data: CreatePostData) {
  const supabase = getAdminSupabaseClient();

  try {
    // Create the post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        title: data.title,
        content: data.content,
        category: data.category,
        type: data.type,
        bank_id: data.bank_id,
        tags: data.tags,
        is_public: data.is_public,
        user_id: data.userId,
        status: "pending",
      })
      .select()
      .single();

    if (postError) throw postError;
    if (!post) throw new Error("Failed to create post");

    revalidatePath("/");
    return { post };
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

export async function uploadPostMedia(
  userId: string,
  file: File,
  bucket: BucketName
) {
  const supabase = await createServiceClient();

  try {
    // Generate unique file path
    const timestamp = new Date().getTime();
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${file.name.replace(
      /\.[^/.]+$/,
      ""
    )}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;

    return { fileUrl };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

export async function linkPostMedia(postId: string, mediaFiles: MediaFile[]) {
  const supabase = await createServiceClient();

  try {
    const { error } = await supabase.from("post_media").insert(
      mediaFiles.map((file) => ({
        post_id: postId,
        file_url: file.file_url,
        file_name: file.file_name,
        file_type: file.file_type,
        file_size: file.file_size,
      }))
    );

    if (error) throw error;
  } catch (error) {
    console.error("Error linking media files:", error);
    throw error;
  }
}
