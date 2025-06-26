/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { FileUpload } from "@/components/ui/file-upload";
import {
  POST_CATEGORIES,
  POST_TYPES,
  PostCategory,
  PostType,
} from "@/lib/types";
import { createPostAction } from "@/lib/actions/posts";

const createPostSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères"),
  category: z.enum([
    "entretien_sales_trading",
    "conseils_ecole",
    "stage_summer_graduate",
    "quant_hedge_funds",
  ]),
  type: z.enum([
    "question",
    "retour_experience",
    "transcript_entretien",
    "fichier_attache",
  ]),
  tags: z.array(z.string()).min(1, "Au moins un tag est requis"),
  is_public: z.boolean(),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

interface CreatePostFormProps {
  userId: string;
}

export function CreatePostForm({ userId }: CreatePostFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      category: "entretien_sales_trading",
      type: "question",
      tags: [],
      is_public: true,
    },
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;
  const tags = watch("tags");

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== tag)
    );
  };

  const onSubmit = async (data: CreatePostForm) => {
    console.log("🚀 Starting form submission with server action...", {
      data,
      content,
    });

    try {
      setIsLoading(true);
      console.log("⏳ Loading state set to true");

      // Validate content from Tiptap editor - check text content, not HTML
      const textContent = content.replace(/<[^>]*>/g, "").trim(); // Strip HTML tags
      console.log("📝 Content validation:", {
        hasContent: !!content,
        textContentLength: textContent.length,
        rawContent: content.substring(0, 100) + "...",
      });

      if (!content || textContent.length < 10) {
        console.log("❌ Content validation failed");
        toast.error("Le contenu doit contenir au moins 10 caractères");
        return;
      }

      // Prepare data for server action
      console.log("📋 Preparing data for server action...", {
        mediaFilesCount: mediaFiles.length,
        documentFilesCount: documentFiles.length,
      });

      const result = await createPostAction({
        title: data.title,
        content: content,
        category: data.category,
        type: data.type,
        tags: data.tags,
        is_public: data.is_public,
        userId: userId,
        mediaFiles: mediaFiles,
        documentFiles: documentFiles,
      });

      console.log("📊 Server action result:", result);

      if (result.success) {
        console.log("🎉 Post creation completed successfully!");
        toast.success(result.message);

        console.log("🔄 Redirecting to home page...");
        router.push("/");
        router.refresh();
        console.log("✅ Redirect initiated");
      } else {
        console.error("❌ Server action failed:", result.error);
        toast.error(
          result.error || "Erreur lors de la création de la publication"
        );
      }
    } catch (error) {
      console.error("💥 Error in form submission:", error);
      console.error("📊 Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        error,
      });
      toast.error("Erreur lors de la création de la publication");
    } finally {
      console.log("🏁 Finally block - setting loading to false");
      setIsLoading(false);
      console.log("✅ Loading state reset");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              placeholder="Titre de votre publication..."
              {...form.register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select
                value={watch("category")}
                onValueChange={(value: PostCategory) =>
                  setValue("category", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POST_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label as any}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type de publication *</Label>
              <Select
                value={watch("type")}
                onValueChange={(value: PostType) => setValue("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POST_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label as any}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter un tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            {errors.tags && (
              <p className="text-sm text-destructive">{errors.tags.message}</p>
            )}
          </div>

          {/* Public/Private */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={watch("is_public")}
              onCheckedChange={(checked) => setValue("is_public", checked)}
            />
            <Label htmlFor="is_public">
              Publication publique (visible par les utilisateurs non connectés)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu</CardTitle>
        </CardHeader>
        <CardContent>
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Écrivez le contenu de votre publication..."
          />
        </CardContent>
      </Card>

      {/* Media Files */}
      <Card>
        <CardHeader>
          <CardTitle>Médias (optionnel)</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFilesChange={setMediaFiles}
            maxFiles={3}
            acceptedTypes={["image/*", "video/*"]}
            maxSize={50}
            label="Images et vidéos"
            description="Maximum 3 fichiers (images ou vidéos), 50MB par fichier"
          />
        </CardContent>
      </Card>

      {/* Document Files */}
      <Card>
        <CardHeader>
          <CardTitle>Documents (optionnel)</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFilesChange={setDocumentFiles}
            maxFiles={2}
            acceptedTypes={[".pdf", ".doc", ".docx", ".txt"]}
            maxSize={10}
            label="Documents"
            description="Maximum 2 documents, 10MB par fichier"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publier
        </Button>
      </div>
    </form>
  );
}
