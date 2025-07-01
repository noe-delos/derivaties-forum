"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { createComment } from "@/lib/services/comments";
import { useAuth } from "@/lib/providers/auth-provider";

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
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isSubmitDisabled = content.length < 5 || isLoading || !profile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitDisabled) return;

    try {
      setIsLoading(true);
      await createComment({
        post_id: postId,
        parent_id: parentId,
        content,
        user_id: profile.id,
      });

      setContent("");

      // Invalidate comments queries to show new comment
      queryClient.invalidateQueries({
        queryKey: ["comments", postId],
      });

      toast.success("Commentaire publié!");
      onSuccess?.();
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error("Erreur lors de la publication du commentaire");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
        <Button
          type="submit"
          disabled={isSubmitDisabled}
          className="min-w-[120px]"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Publication..." : parentId ? "Répondre" : "Commenter"}
        </Button>
      </div>
    </form>
  );
}
