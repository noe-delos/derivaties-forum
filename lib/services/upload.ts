import { createClient } from "@/lib/supabase/server";

export async function uploadFile(
  file: File,
  bucket: "profile-pictures" | "post-media" | "post-files"
): Promise<{
  url: string;
  name: string;
  size: number;
  type: string;
}> {
  const supabase = await createClient();

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;
  const filePath = `${bucket}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return {
    url: publicUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

export async function deleteFile(
  filePath: string,
  bucket: "profile-pictures" | "post-media" | "post-files"
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
