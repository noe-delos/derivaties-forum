"use client";

import { useState, useEffect } from "react";
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
import { User as UserType } from "@/lib/types";

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
  const [profile, setProfile] = useState<UserType | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState("");
  const { supabase } = useAuth();

  console.log("CommentForm render:", {
    postId,
    parentId,
    isAuthenticated,
    profile: !!profile,
    content: content.length,
  });

  const form = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      console.log("CommentForm: Fetching user data...");
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("CommentForm: Session:", !!session?.user);

        if (session?.user) {
          setIsAuthenticated(true);

          // Fetch user profile
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          console.log("CommentForm: Profile fetched:", !!data);
          setProfile(data as UserType);
        } else {
          setIsAuthenticated(false);
          setProfile(null);
        }
      } catch (error) {
        console.error("CommentForm: Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [supabase]);

  // Update form when content changes
  useEffect(() => {
    form.setValue("content", content);
  }, [content, form]);

  const onSubmit = async (data: CommentForm) => {
    console.log("CommentForm: Submit triggered", {
      data,
      content,
      profile: !!profile,
      isAuthenticated,
      postId,
      parentId,
    });

    if (!profile) {
      console.error("CommentForm: No profile found");
      toast.error("Vous devez être connecté pour commenter");
      return;
    }

    if (!content.trim()) {
      console.error("CommentForm: No content");
      toast.error("Le commentaire ne peut pas être vide");
      return;
    }

    if (content.length < 5) {
      console.error("CommentForm: Content too short", content.length);
      toast.error("Le commentaire doit contenir au moins 5 caractères");
      return;
    }

    try {
      setIsLoading(true);
      console.log("CommentForm: Creating comment...", {
        post_id: postId,
        parent_id: parentId,
        content: content.substring(0, 50) + "...",
        user_id: profile.id,
      });

      const result = await createComment({
        post_id: postId,
        parent_id: parentId,
        content,
        user_id: profile.id,
      });

      console.log("CommentForm: Comment created successfully", result);
      toast.success("Commentaire publié!");
      setContent("");
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("CommentForm: Error creating comment:", error);
      toast.error("Erreur lors de la publication du commentaire");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    console.log("CommentForm: Content changed", newContent.length);
    setContent(newContent);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground">Connectez-vous pour commenter</p>
        </CardContent>
      </Card>
    );
  }

  const isSubmitDisabled = isLoading || !content.trim() || content.length < 5;

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TiptapEditor
            content={content}
            onChange={handleContentChange}
            placeholder={placeholder}
          />

          {/* Debug info */}
          <div className="text-xs text-muted-foreground">
            Caractères: {content.length} | Minimum: 5 | Valide:{" "}
            {content.length >= 5 ? "✓" : "✗"}
          </div>

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
              {isLoading
                ? "Publication..."
                : parentId
                ? "Répondre"
                : "Commenter"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
