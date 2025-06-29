/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
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
import { toast } from "sonner";

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
import {
  Post,
  POST_CATEGORIES,
  POST_TYPES,
  User as UserType,
} from "@/lib/types";
import { votePost } from "@/lib/services/posts";

interface PostCardProps {
  post: Post;
  isBlurred?: boolean;
  showActions?: boolean;
  expanded?: boolean;
  className?: string;
  isAuthenticated?: boolean;
  profile?: UserType | null;
}

export function PostCard({
  post,
  isBlurred = false,
  showActions = true,
  expanded = false,
  className,
  isAuthenticated = false,
  profile = null,
}: PostCardProps) {
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
    if (!isAuthenticated || !profile) {
      toast.error("Vous devez être connecté pour voter");
      return;
    }

    try {
      setIsVoting(true);
      await votePost(post.id, voteType, profile.id);
      toast.success("Vote enregistré!");

      // Optionally refresh the page or update the post data
      // For now, we'll just show success message
      // In a real app, you'd want to update the post data in the query cache
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Erreur lors du vote");
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
      toast.success("Lien copié dans le presse-papiers!");
    }
  };

  const displayContent = expanded
    ? post.content
    : post.content.length > 200
    ? post.content.substring(0, 200) + "..."
    : post.content;

  const userVote = post.user_vote?.vote_type;

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
            <div className="space-y-4">
              {/* Images */}
              {(() => {
                const images = post.media.filter(
                  (m) => m.file_type === "image"
                );

                if (images.length === 0) return null;

                if (images.length === 1) {
                  return (
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <img
                        src={images[0].file_url}
                        alt="Post media"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  );
                }

                if (images.length === 2) {
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((image, index) => (
                        <div
                          key={index}
                          className="relative aspect-video rounded-lg overflow-hidden"
                        >
                          <img
                            src={image.file_url}
                            alt={`Post media ${index + 1}`}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  );
                }

                if (images.length === 3) {
                  return (
                    <div className="grid grid-cols-2 gap-2 h-80">
                      <div className="relative rounded-lg overflow-hidden">
                        <img
                          src={images[0].file_url}
                          alt="Post media 1"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="grid grid-rows-2 gap-2">
                        {images.slice(1).map((image, index) => (
                          <div
                            key={index + 1}
                            className="relative rounded-lg overflow-hidden"
                          >
                            <img
                              src={image.file_url}
                              alt={`Post media ${index + 2}`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // 4 or more images
                return (
                  <div className="grid grid-cols-2 gap-2 h-80">
                    <div className="relative rounded-lg overflow-hidden">
                      <img
                        src={images[0].file_url}
                        alt="Post media 1"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="grid grid-rows-2 gap-2">
                      {images.slice(1, 3).map((image, index) => (
                        <div
                          key={index + 1}
                          className="relative rounded-lg overflow-hidden"
                        >
                          <img
                            src={image.file_url}
                            alt={`Post media ${index + 2}`}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                      {images.length > 3 && (
                        <div className="relative rounded-lg overflow-hidden bg-black/50">
                          <img
                            src={images[3].file_url}
                            alt="Post media 4"
                            className="object-cover w-full h-full opacity-60"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-lg font-semibold">
                              +{images.length - 3}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Files */}
              {(() => {
                const files = post.media.filter(
                  (m) => m.file_type === "document"
                );
                if (files.length === 0) return null;

                return (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Fichiers joints ({files.length})
                    </h4>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <a
                          key={index}
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                            <svg
                              className="h-4 w-4 text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.file_size
                                ? `${Math.round(file.file_size / 1024)} KB`
                                : "Fichier"}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}
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
                    userVote === 1 && "text-green-600 bg-green-50"
                  )}
                  title={
                    !isAuthenticated
                      ? "Connectez-vous pour voter"
                      : "Voter pour"
                  }
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
                    userVote === -1 && "text-red-600 bg-red-50"
                  )}
                  title={
                    !isAuthenticated
                      ? "Connectez-vous pour voter"
                      : "Voter contre"
                  }
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
