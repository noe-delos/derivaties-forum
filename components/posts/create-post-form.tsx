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
import { POST_CATEGORIES, POST_TYPES } from "@/lib/types";
import {
  createPostServer,
  uploadPostMedia,
  linkPostMedia,
} from "@/lib/actions/posts";

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

const RequiredAsterisk = () => <span className="text-destructive ml-1">*</span>;

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

  const onSubmit = async (formData: CreatePostForm) => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      const textContent = content.replace(/<[^>]*>/g, "").trim();
      if (textContent.length < 10) {
        toast.error("Le contenu doit contenir au moins 10 caractères");
        setIsLoading(false);
        return;
      }

      const { post } = await createPostServer({
        title: formData.title,
        content,
        category: formData.category,
        type: formData.type,
        tags: formData.tags,
        is_public: formData.is_public,
        userId,
      });

      if (mediaFiles.length > 0 || documentFiles.length > 0) {
        const uploadPromises = [
          ...mediaFiles.map(async (file) => {
            const { fileUrl } = await uploadPostMedia(
              userId,
              file,
              "post-media"
            );
            return {
              file_url: fileUrl,
              file_name: file.name,
              file_type: file.type.startsWith("image/") ? "image" : "video",
              file_size: file.size,
            };
          }),
          ...documentFiles.map(async (file) => {
            const { fileUrl } = await uploadPostMedia(
              userId,
              file,
              "post-files"
            );
            return {
              file_url: fileUrl,
              file_name: file.name,
              file_type: "document",
              file_size: file.size,
            };
          }),
        ];

        const uploadedFiles = await Promise.all(uploadPromises);
        await linkPostMedia(post.id, uploadedFiles);
      }

      toast.info("Publication envoyé pour vérification !");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Erreur lors de la création de la publication");
    } finally {
      setIsLoading(false);
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
            <Label htmlFor="title">
              Titre
              <RequiredAsterisk />
            </Label>
            <Input
              id="title"
              placeholder="Titre de votre publication..."
              className="py-6 rounded-2xl transition-shadow cursor-pointer placeholder:text-foreground/20"
              {...form.register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Catégorie
                <RequiredAsterisk />
              </Label>
              <Select
                value={watch("category")}
                onValueChange={(value: CreatePostForm["category"]) =>
                  setValue("category", value)
                }
              >
                <SelectTrigger className="py-6 rounded-2xl shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POST_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {String(label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Type de publication
                <RequiredAsterisk />
              </Label>
              <Select
                value={watch("type")}
                onValueChange={(value: CreatePostForm["type"]) =>
                  setValue("type", value)
                }
              >
                <SelectTrigger className="py-6 rounded-2xl shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POST_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {String(label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>
              Tags
              <RequiredAsterisk />
            </Label>
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
                className="py-6 rounded-2xl shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer placeholder:text-foreground/20"
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

      {/* Media Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Images et vidéos</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFilesChange={setMediaFiles}
            maxFiles={5}
            acceptedTypes={["image/*", "video/*"]}
            maxSize={10}
            label="Télécharger des médias"
            description="Ajoutez des images ou des vidéos à votre publication"
          />
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFilesChange={setDocumentFiles}
            maxFiles={3}
            acceptedTypes={[".pdf", ".doc", ".docx"]}
            maxSize={10}
            label="Télécharger des documents"
            description="Ajoutez des documents à votre publication"
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
          {isLoading ? "Publication en cours..." : "Publier"}
        </Button>
      </div>
    </form>
  );
}
