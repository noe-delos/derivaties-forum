/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Eye,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Post, POST_CATEGORIES, POST_TYPES } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

interface PostCardProps {
  post: Post;
  isBlurred?: boolean;
  showActions?: boolean;
  expanded?: boolean;
  className?: string;
}

export function PostCard({
  post,
  isBlurred = false,
  showActions = true,
  expanded = false,
  className,
}: PostCardProps) {
  const { isAuthenticated, profile } = useAuth();
  const [isVoting, setIsVoting] = useState(false);

  const getUserInitials = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.username) {
      return user.username;
    }
    return "Utilisateur anonyme";
  };

  const handleVote = async (voteType: 1 | -1) => {
    if (!isAuthenticated || !profile) return;

    setIsVoting(true);
    try {
      // TODO: Implement vote mutation
      console.log("Vote:", voteType, "on post:", post.id);
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          url: `${window.location.origin}/post/${post.id}`,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(
        `${window.location.origin}/post/${post.id}`
      );
    }
  };

  const displayContent = expanded
    ? post.content
    : post.content.length > 200
    ? post.content.substring(0, 200) + "..."
    : post.content;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${post.user?.id}`}>
              <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage
                  src={post.user?.profile_picture_url}
                  alt={getUserDisplayName(post.user)}
                />
                <AvatarFallback className="text-xs">
                  {getUserInitials(post.user)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/profile/${post.user?.id}`}
                  className="font-medium hover:underline"
                >
                  {getUserDisplayName(post.user)}
                </Link>
                {post.user?.role !== "user" && (
                  <Badge variant="outline" className="text-xs">
                    {post.user?.role}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    locale: fr,
                    addSuffix: true,
                  })}
                </span>
                <span>•</span>
                <Badge variant="secondary" className="text-xs">
                  {POST_CATEGORIES[post.category]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {POST_TYPES[post.type]}
                </Badge>
              </div>
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager
                </DropdownMenuItem>
                {isAuthenticated && profile?.id === post.user_id && (
                  <>
                    <DropdownMenuItem>Modifier</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className={cn("space-y-3", isBlurred && "relative")}>
          {expanded ? (
            <h1 className="font-bold text-2xl">{post.title}</h1>
          ) : (
            <Link href={`/post/${post.id}`}>
              <h3 className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer">
                {post.title}
              </h3>
            </Link>
          )}

          {/* Post Tags - Only show in expanded view */}
          {expanded && post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, expanded ? 10 : 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {!expanded && post.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{post.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Media Gallery */}
          {post.media && post.media.length > 0 && (
            <div className="grid gap-2">
              {post.media[0].file_type === "image" && (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={post.media[0].file_url}
                    alt="Post media"
                    fill
                    className="object-cover"
                  />
                  {post.media.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      +{post.media.length - 1}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div
            className={cn(
              "prose prose-sm max-w-none",
              isBlurred && "blur-sm select-none pointer-events-none"
            )}
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />

          {/* Blur overlay for anonymous users */}
          {isBlurred && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90 flex items-end justify-center pb-4">
              <Button asChild>
                <Link href="/auth/signup">
                  <Eye className="mr-2 h-4 w-4" />
                  Voir plus
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="pt-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              {/* Voting */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(1)}
                  disabled={!isAuthenticated || isVoting}
                  className={cn(
                    "h-8 w-8 p-0",
                    post.user_vote?.vote_type === 1 &&
                      "text-green-600 bg-green-50"
                  )}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[2rem] text-center">
                  {post.upvotes - post.downvotes}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(-1)}
                  disabled={!isAuthenticated || isVoting}
                  className={cn(
                    "h-8 w-8 p-0",
                    post.user_vote?.vote_type === -1 && "text-red-600 bg-red-50"
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments */}
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href={`/post/${post.id}#comments`}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments_count}</span>
                </Link>
              </Button>

              {/* Share */}
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
