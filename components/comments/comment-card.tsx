"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronUp, ChevronDown, Reply } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommentForm } from "./comment-form";
import { Comment } from "@/lib/types";
import { useServerAuth } from "@/components/layout/root-layout-client";
import { voteComment } from "@/lib/services/comments";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentCardProps {
  comment: Comment;
  isBlurred?: boolean;
  level?: number;
  activeEditor: string | null;
  onEditorChange: (editorId: string | null) => void;
}

export function CommentCard({
  comment,
  isBlurred = false,
  level = 0,
  activeEditor,
  onEditorChange,
}: CommentCardProps) {
  const { isAuthenticated, profile } = useServerAuth();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteType: 1 | -1) => {
    if (!isAuthenticated || !profile) {
      toast.error("Vous devez être connecté pour voter");
      return;
    }

    try {
      setIsVoting(true);
      await voteComment(comment.id, voteType, profile.id);

      // Invalidate comments query to refresh vote counts
      queryClient.invalidateQueries({
        queryKey: ["comments", comment.post_id],
      });

      toast.success("Vote enregistré!");
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Erreur lors du vote");
    } finally {
      setIsVoting(false);
    }
  };

  const getUserDisplayName = () => {
    if (comment.user?.username) return comment.user.username;
    if (comment.user?.first_name && comment.user?.last_name) {
      return `${comment.user.first_name} ${comment.user.last_name}`;
    }
    return "Utilisateur anonyme";
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userVote = comment.user_vote?.vote_type;
  const isReplyFormVisible = activeEditor === comment.id;

  const handleSuccessfulReply = () => {
    onEditorChange(null);
    // Invalidate comments query to show new reply
    queryClient.invalidateQueries({
      queryKey: ["comments", comment.post_id],
    });
  };

  return (
    <div className="py-2 px-3 hover:bg-muted/30 rounded-lg transition-colors">
      <div className="flex gap-2">
        <Avatar className="h-6 w-6 mt-1">
          <AvatarImage
            src={comment.user?.profile_picture_url}
            alt={getUserDisplayName()}
          />
          <AvatarFallback className="text-xs">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium">{getUserDisplayName()}</span>
            {comment.user?.role === "moderator" && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                Mod
              </Badge>
            )}
            {comment.user?.role === "admin" && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                Admin
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>

          <div
            className={cn(
              "text-sm font-normal",
              isBlurred && "blur-sm select-none pointer-events-none"
            )}
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          <div className="flex items-center gap-2 pt-0.5">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(1)}
                disabled={isVoting || !isAuthenticated}
                className={cn("h-6 px-1", userVote === 1 && "text-green-600")}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium min-w-[2ch] text-center">
                {comment.upvotes - comment.downvotes}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(-1)}
                disabled={isVoting || !isAuthenticated}
                className={cn("h-6 px-1", userVote === -1 && "text-red-600")}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {isAuthenticated && level < 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onEditorChange(isReplyFormVisible ? null : comment.id)
                }
                className="h-6 px-2 text-xs"
              >
                <Reply className="h-3 w-3 mr-1" />
                {isReplyFormVisible ? "Annuler" : "Répondre"}
              </Button>
            )}
          </div>

          {isReplyFormVisible && isAuthenticated && (
            <div className="mt-2">
              <CommentForm
                postId={comment.post_id}
                parentId={comment.id}
                onSuccess={handleSuccessfulReply}
                placeholder="Répondre à ce commentaire..."
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-1">
              {comment.replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  isBlurred={isBlurred}
                  level={level + 1}
                  activeEditor={activeEditor}
                  onEditorChange={onEditorChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
