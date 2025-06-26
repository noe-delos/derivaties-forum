"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronUp, ChevronDown, Reply, MoreHorizontal } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentForm } from "./comment-form";
import { Comment } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { voteComment } from "@/lib/services/comments";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentCardProps {
  comment: Comment;
  isBlurred?: boolean;
  level?: number;
}

export function CommentCard({
  comment,
  isBlurred = false,
  level = 0,
}: CommentCardProps) {
  const { profile, isAuthenticated } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteType: 1 | -1) => {
    if (!isAuthenticated || !profile) {
      toast.error("Vous devez être connecté pour voter");
      return;
    }

    try {
      setIsVoting(true);
      await voteComment(comment.id, voteType, profile.id);
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

  const isOwner = profile?.id === comment.user_id;
  const userVote = comment.user_vote?.vote_type;

  return (
    <Card className={cn("", level > 0 && "ml-8 border-l-2 border-muted")}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={comment.user?.profile_picture_url}
              alt={getUserDisplayName()}
            />
            <AvatarFallback className="text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {getUserDisplayName()}
                </span>
                {comment.user?.role === "moderator" && (
                  <Badge variant="secondary" className="text-xs">
                    Modérateur
                  </Badge>
                )}
                {comment.user?.role === "admin" && (
                  <Badge variant="destructive" className="text-xs">
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

              {(isOwner ||
                profile?.role === "moderator" ||
                profile?.role === "admin") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwner && <DropdownMenuItem>Modifier</DropdownMenuItem>}
                    <DropdownMenuItem className="text-destructive">
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Content */}
            <div
              className={cn(
                "text-sm",
                isBlurred && "blur-sm select-none pointer-events-none"
              )}
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Voting */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(1)}
                  disabled={isVoting || !isAuthenticated}
                  className={cn(
                    "h-8 px-2",
                    userVote === 1 && "text-green-600 bg-green-50"
                  )}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[2ch] text-center">
                  {comment.upvotes - comment.downvotes}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(-1)}
                  disabled={isVoting || !isAuthenticated}
                  className={cn(
                    "h-8 px-2",
                    userVote === -1 && "text-red-600 bg-red-50"
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Reply */}
              {isAuthenticated && level < 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="h-8"
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Répondre
                </Button>
              )}
            </div>

            {/* Reply Form */}
            {showReplyForm && isAuthenticated && (
              <div className="mt-4">
                <CommentForm
                  postId={comment.post_id}
                  parentId={comment.id}
                  onSuccess={() => setShowReplyForm(false)}
                  placeholder="Répondre à ce commentaire..."
                />
              </div>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-3">
                {comment.replies.map((reply) => (
                  <CommentCard
                    key={reply.id}
                    comment={reply}
                    isBlurred={isBlurred}
                    level={level + 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
