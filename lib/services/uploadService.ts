import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

export type UploadResult = {
  path: string;
  size: number;
  type: string;
};

export async function uploadFile(
  file: File,
  bucket: string = "posts"
): Promise<UploadResult> {
  const supabase = createClient();

  // Generate a unique file name to avoid collisions
  const fileExt = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload the file to Supabase storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) {
    throw new Error(`Error uploading file: ${error.message}`);
  }

  if (!data) {
    throw new Error("Upload failed - no data returned");
  }

  // Return the file information
  return {
    path: data.path,
    size: file.size,
    type: file.type,
  };
}

export async function uploadMultipleFiles(
  files: File[],
  bucket: string = "posts"
): Promise<UploadResult[]> {
  // Upload files sequentially to avoid overwhelming the connection
  const results: UploadResult[] = [];

  for (const file of files) {
    const result = await uploadFile(file, bucket);
    results.push(result);
  }

  return results;
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
