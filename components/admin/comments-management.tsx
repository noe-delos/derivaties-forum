/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  Trash2,
  Eye,
  User,
  Calendar,
  MessageSquare,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllComments, deleteComment } from "@/lib/services/admin";
import { useSupabase } from "@/hooks/use-supabase";
import { getUserDisplayName, getUserInitials } from "@/lib/utils";

interface DeleteCommentDialogProps {
  commentId: string;
  onConfirm: (commentId: string) => void;
  isLoading: boolean;
}

function DeleteCommentDialog({
  commentId,
  onConfirm,
  isLoading,
}: DeleteCommentDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm(commentId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le commentaire</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est
            irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            variant="destructive"
            disabled={isLoading}
          >
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CommentsManagement() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: () => fetchAllComments(supabase),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(supabase, commentId),
    onSuccess: () => {
      toast.success("Commentaire supprimé avec succès");
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error) => {
      console.error("Delete comment error:", error);
      toast.error("Erreur lors de la suppression du commentaire");
    },
  });

  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  // Filter comments based on search
  const filteredComments =
    comments?.filter((comment: any) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        comment.content.toLowerCase().includes(searchLower) ||
        getUserDisplayName(comment.user).toLowerCase().includes(searchLower) ||
        comment.post?.title?.toLowerCase().includes(searchLower)
      );
    }) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
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
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans les commentaires..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">commentaires</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtrés</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredComments.length}</div>
            <p className="text-xs text-muted-foreground">résultats</p>
          </CardContent>
        </Card>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Aucun commentaire trouvé" : "Aucun commentaire"}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery
                  ? "Essayez de modifier votre recherche"
                  : "Il n'y a pas encore de commentaires à modérer"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredComments.map((comment: any) => (
            <Card key={comment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={comment.user?.profile_picture_url}
                        alt={getUserDisplayName(comment.user)}
                      />
                      <AvatarFallback>
                        {getUserInitials(comment.user)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getUserDisplayName(comment.user)}
                        </span>
                        {comment.user?.role !== "user" && (
                          <Badge variant="outline" className="text-xs">
                            {comment.user?.role}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(comment.created_at), {
                            locale: fr,
                            addSuffix: true,
                          })}
                        </div>
                        {comment.post && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span className="truncate max-w-48">
                              {comment.post.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {comment.post && (
                        <DropdownMenuItem asChild>
                          <a
                            href={`/forum/post/${comment.post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Voir le post
                          </a>
                        </DropdownMenuItem>
                      )}

                      <DeleteCommentDialog
                        commentId={comment.id}
                        onConfirm={handleDeleteComment}
                        isLoading={deleteCommentMutation.isPending}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: comment.content,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
