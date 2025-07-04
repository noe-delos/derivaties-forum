/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Check,
  X,
  Eye,
  User,
  Calendar,
  Tag,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPendingPosts, updatePostStatus } from "@/lib/services/admin";
import { useSupabase } from "@/hooks/use-supabase";
import { POST_CATEGORIES, POST_TYPES, PostStatus } from "@/lib/types";
import { getUserDisplayName, getUserInitials } from "@/lib/utils";

interface ModerationDialogProps {
  postId: string;
  action: "approve" | "reject";
  onConfirm: (postId: string, status: PostStatus, note?: string) => void;
  isLoading: boolean;
}

function ModerationDialog({
  postId,
  action,
  onConfirm,
  isLoading,
}: ModerationDialogProps) {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm(postId, action === "approve" ? "approved" : "rejected", note);
    setOpen(false);
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={action === "approve" ? "default" : "destructive"}
          size="sm"
          disabled={isLoading}
        >
          {action === "approve" ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Approuver
            </>
          ) : (
            <>
              <X className="h-4 w-4 mr-2" />
              Rejeter
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "approve"
              ? "Approuver la publication"
              : "Rejeter la publication"}
          </DialogTitle>
          <DialogDescription>
            {action === "approve"
              ? "Cette publication sera visible par tous les utilisateurs."
              : "Cette publication sera rejetée et l'auteur en sera informé."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">
              Note {action === "reject" ? "(obligatoire)" : "(optionnelle)"}
            </Label>
            <Textarea
              id="note"
              placeholder={
                action === "approve"
                  ? "Note interne pour l'équipe de modération..."
                  : "Expliquez pourquoi cette publication est rejetée..."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required={action === "reject"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            variant={action === "approve" ? "default" : "destructive"}
            disabled={action === "reject" && !note.trim()}
          >
            {action === "approve" ? "Approuver" : "Rejeter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PostsModeration() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-pending-posts"],
    queryFn: () => fetchPendingPosts(supabase),
  });

  const moderationMutation = useMutation({
    mutationFn: ({
      postId,
      status,
      note,
    }: {
      postId: string;
      status: PostStatus;
      note?: string;
    }) => updatePostStatus(supabase, postId, status, note),
    onSuccess: (_, { status }) => {
      toast.success(
        status === "approved"
          ? "Publication approuvée !"
          : "Publication rejetée !"
      );
      queryClient.invalidateQueries({ queryKey: ["admin-pending-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error) => {
      console.error("Moderation error:", error);
      toast.error("Erreur lors de la modération");
    },
  });

  const handleModeration = (
    postId: string,
    status: PostStatus,
    note?: string
  ) => {
    moderationMutation.mutate({ postId, status, note });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Check className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Aucune publication en attente
          </h3>
          <p className="text-muted-foreground text-center">
            Toutes les publications ont été modérées. Excellent travail !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {posts.length} publication{posts.length > 1 ? "s" : ""} en attente
        </p>
      </div>

      <div className="space-y-4">
        {posts.map((post: any) => (
          <Card key={post.id} className="border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={post.user?.profile_picture_url}
                      alt={getUserDisplayName(post.user)}
                    />
                    <AvatarFallback>
                      {getUserInitials(post.user)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{post.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {POST_CATEGORIES[post.category]}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {POST_TYPES[post.type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {getUserDisplayName(post.user)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(post.created_at), {
                          locale: fr,
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700"
                >
                  En attente
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Content Preview */}
                <div className="prose prose-sm max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        post.content.length > 200
                          ? post.content.substring(0, 200) + "..."
                          : post.content,
                    }}
                  />
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Public/Private */}
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {post.is_public
                      ? "Publication publique"
                      : "Publication privée"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/forum/post/${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </a>
                  </Button>

                  <ModerationDialog
                    postId={post.id}
                    action="approve"
                    onConfirm={handleModeration}
                    isLoading={moderationMutation.isPending}
                  />

                  <ModerationDialog
                    postId={post.id}
                    action="reject"
                    onConfirm={handleModeration}
                    isLoading={moderationMutation.isPending}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
