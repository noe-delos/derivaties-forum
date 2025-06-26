/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { createComment } from "@/lib/services/comments";
import { useAuth } from "@/hooks/use-auth";

const commentSchema = z.object({
  content: z
    .string()
    .min(5, "Le commentaire doit contenir au moins 5 caractères"),
});

type CommentForm = z.infer<typeof commentSchema>;

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  placeholder?: string;
}

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  placeholder = "Écrivez votre commentaire...",
}: CommentFormProps) {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState("");

  const form = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: CommentForm) => {
    if (!profile) {
      toast.error("Vous devez être connecté pour commenter");
      return;
    }

    try {
      setIsLoading(true);

      await createComment({
        post_id: postId,
        parent_id: parentId,
        content,
        user_id: profile.id,
      });

      toast.success("Commentaire publié!");
      setContent("");
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error("Erreur lors de la publication du commentaire");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder={placeholder}
          />

          <div className="flex justify-end gap-2">
            {onSuccess && (
              <Button
                type="button"
                variant="outline"
                onClick={onSuccess}
                disabled={isLoading}
              >
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {parentId ? "Répondre" : "Commenter"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
