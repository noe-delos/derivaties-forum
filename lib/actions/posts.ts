/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createPost, addPostMedia } from "@/lib/services/posts";
import { uploadFile } from "@/lib/services/upload";
import { PostCategory, PostType } from "@/lib/types";

interface CreatePostData {
  title: string;
  content: string;
  category: PostCategory;
  type: PostType;
  tags: string[];
  is_public: boolean;
  userId: string;
  mediaFiles?: File[];
  documentFiles?: File[];
}

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

    // Upload files first if any
    const uploadedMedia: Array<{
      url: string;
      name: string;
      size: number;
      type: string;
    }> = [];

    if (data.mediaFiles && data.mediaFiles.length > 0) {
      console.log("🖼️ Server Action: Uploading media files...");
      for (const file of data.mediaFiles) {
        console.log("📤 Server Action: Uploading media file:", file.name);
        const uploadResult = await uploadFile(file, "post-media");
        console.log("✅ Server Action: Media file uploaded:", uploadResult.url);
        uploadedMedia.push(uploadResult);
      }
    }

    if (data.documentFiles && data.documentFiles.length > 0) {
      console.log("📄 Server Action: Uploading document files...");
      for (const file of data.documentFiles) {
        console.log("📤 Server Action: Uploading document file:", file.name);
        const uploadResult = await uploadFile(file, "post-files");
        console.log(
          "✅ Server Action: Document file uploaded:",
          uploadResult.url
        );
        uploadedMedia.push(uploadResult);
      }
    }

    console.log(
      "✅ Server Action: All files uploaded successfully:",
      uploadedMedia
    );

    // Create the post
    console.log("💾 Server Action: Creating post in database...");
    const createdPost = await createPost({
      title: data.title,
      content: data.content,
      category: data.category,
      type: data.type,
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
