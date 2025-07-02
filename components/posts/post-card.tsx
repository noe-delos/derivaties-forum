/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { Eye, MapPin } from "lucide-react";
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
import { Post, User as UserType } from "@/lib/types";
import { votePost } from "@/lib/services/posts";
import { useRouter } from "next/navigation";
import { getCategoryLabel, getCityLabel } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  isBlurred?: boolean;
  showActions?: boolean;
  expanded?: boolean;
  className?: string;
  isAuthenticated?: boolean;
  profile?: UserType | null;
}

const categoryColors: Record<string, string> = {
  interview: "bg-blue-500 text-white",
  salary: "bg-green-500 text-white",
  internship: "bg-purple-500 text-white",
  career: "bg-orange-500 text-white",
  networking: "bg-pink-500 text-white",
  general: "bg-gray-500 text-white",
};

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
  const [shareOpen, setShareOpen] = useState(false);
  const router = useRouter();

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

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/post/${post.id}`
    );
    toast.success("Lien copié dans le presse-papiers!");
    setShareOpen(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest('[role="button"]') ||
      expanded
    ) {
      return;
    }

    // Navigate to post detail
    router.push(`/post/${post.id}`);
  };

  const displayContent = expanded
    ? post.content
    : post.content.length > 200
    ? post.content.substring(0, 200) + "..."
    : post.content;

  const userVote = post.user_vote?.vote_type;
  const netVotes = post.upvotes - post.downvotes;

  return (
    <Card
      className={cn(
        "w-full hover:bg-muted/50 hover:cursor-pointer transition-colors",
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Bank Logo and Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative flex-shrink-0">
                {post.bank?.logo_url ? (
                  <img
                    src={post.bank.logo_url}
                    alt={post.bank.name || "Bank"}
                    className="object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Icon
                      icon="mdi:bank"
                      className="h-6 w-6 text-muted-foreground"
                    />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-lg">
                    {post.bank?.name || "Banque"}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {formatDistanceToNow(new Date(post.created_at), {
                      locale: fr,
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category on top right */}
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "text-sm px-3 py-1 rounded-full font-medium",
                categoryColors[post.category] || categoryColors.general
              )}
            >
              {getCategoryLabel(post.category)}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {getCityLabel(post.city)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className={cn("space-y-3", isBlurred && "relative")}>
          {expanded ? (
            <h1 className="font-bold text-2xl">{post.title}</h1>
          ) : (
            <h3 className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer">
              {post.title}
            </h3>
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
                  <div className="flex flex-wrap gap-3">
                    {files.map((file, index) => (
                      <a
                        key={index}
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div className="relative size-[4rem] bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center group-hover:shadow-md transition-shadow">
                          {file.file_name?.toLowerCase().endsWith(".pdf") && (
                            <div className="absolute -bottom-1 -right-2">
                              <img
                                src="/pdf.png"
                                alt="PDF"
                                className="w-auto h-7"
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-center max-w-[7rem] truncate">
                          {file.file_name || "Fichier"}
                        </p>
                      </a>
                    ))}
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
            <div className="flex items-center gap-2">
              {/* Voting - styled similar to screenshot */}
              <div className="flex items-center bg-orange-500 text-white rounded-full px-3 py-1 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(1)}
                  disabled={!isAuthenticated || isVoting}
                  className={cn(
                    "h-6 w-6 p-0 text-white hover:bg-orange-600 hover:text-white",
                    userVote === 1 && "bg-orange-600"
                  )}
                  title={
                    !isAuthenticated
                      ? "Connectez-vous pour voter"
                      : "Voter pour"
                  }
                >
                  <Icon
                    icon={
                      userVote === 1
                        ? "tabler:arrow-big-up-filled"
                        : "tabler:arrow-big-up"
                    }
                    className="h-4 w-4"
                  />
                </Button>
                <span className="text-sm font-medium px-1">{netVotes}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(-1)}
                  disabled={!isAuthenticated || isVoting}
                  className={cn(
                    "h-6 w-6 p-0 text-white hover:bg-orange-600 hover:text-white",
                    userVote === -1 && "bg-orange-600"
                  )}
                  title={
                    !isAuthenticated
                      ? "Connectez-vous pour voter"
                      : "Voter contre"
                  }
                >
                  <Icon
                    icon={
                      userVote === -1
                        ? "tabler:arrow-big-down-filled"
                        : "tabler:arrow-big-down"
                    }
                    className="h-4 w-4"
                  />
                </Button>
              </div>

              {/* Comments */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="bg-foreground/10 hover:bg-foreground/20 rounded-full px-3"
              >
                <Link
                  href={`/post/${post.id}#comments`}
                  className="flex items-center gap-2"
                >
                  <Icon icon="iconamoon:comment-fill" className="h-4 w-4" />
                  <span>{post.comments_count}</span>
                </Link>
              </Button>

              {/* Share */}
              <DropdownMenu open={shareOpen} onOpenChange={setShareOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-foreground/10 hover:bg-foreground/20 rounded-full px-3 gap-2"
                  >
                    <Icon icon="majesticons:share" className="h-4 w-4" />
                    <span>Partager</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-auto p-2">
                  <DropdownMenuItem>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                      className="w-full justify-start"
                    >
                      <Icon icon="tabler:copy" className="mr-2 h-4 w-4" />
                      Copier le lien
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* User info on the right */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">par</span>
              <Link
                href={`/profile/${post.user?.id}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={post.user?.profile_picture_url}
                    alt={getUserDisplayName(post.user)}
                  />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(post.user)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {getUserDisplayName(post.user)}
                </span>
              </Link>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
