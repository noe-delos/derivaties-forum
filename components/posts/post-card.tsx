/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Post } from "@/lib/types";
import { useRouter } from "next/navigation";
import { getCategoryLabel, getCityLabel } from "@/lib/utils";
import { ReportDialog } from "./report-dialog";

interface PostCardProps {
  post: Post;
  isBlurred?: boolean;
  showActions?: boolean;
  expanded?: boolean;
  className?: string;
  isAuthenticated?: boolean; // Kept for future functionality
  profile?: any; // Kept for future functionality
  isFeedView?: boolean;
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
  isAuthenticated = false, // Kept for future functionality
  profile = null, // Kept for future functionality
  isFeedView = false,
}: PostCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const router = useRouter();

  console.log(isAuthenticated, profile);
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

  return (
    <div
      className={cn(
        "w-full hover:border-muted-foreground/20 hover:cursor-pointer transition-colors p-7 border border-muted-foreground/10 shadow-soft rounded-[1.5rem]",
        className
      )}
      onClick={handleCardClick}
    >
      <div className="pb-4 my-0 py-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Bank Logo and Name */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 relative flex-shrink-0",
                  isFeedView && "size-6"
                )}
              >
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
                  <span
                    className={cn(
                      "font-medium text-lg",
                      isFeedView && "text-md"
                    )}
                  >
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
                "text-xs px-3 py-2 rounded-lg font-medium",
                categoryColors[post.category] || categoryColors.general,
                isBlurred && "blur select-none pointer-events-none opacity-60"
              )}
            >
              {getCategoryLabel(post.category)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "flex items-center py-2 px-3 gap-1 text-sm font-semibold rounded-lg",
                isBlurred && "blur select-none pointer-events-none opacity-80"
              )}
            >
              {getCityLabel(post.city)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="pt-0 my-0 py-0 pb-3">
        <div className={cn("space-y-2", isBlurred && "relative")}>
          {expanded ? (
            <h1
              className={cn(
                "font-medium text-2xl",
                isBlurred && "blur select-none pointer-events-none"
              )}
            >
              {post.title}
            </h1>
          ) : (
            <h3
              className={cn(
                "font-medium text-[1.4rem] hover:text-primary transition-colors cursor-pointer",
                isBlurred && "blur select-none pointer-events-none opacity-80"
              )}
            >
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
                    <div className="relative size-fit rounded-lg overflow-hidden">
                      <img
                        src={images[0].file_url}
                        alt="Post media"
                        className={cn(
                          "object-cover size-[50%] rounded-lg",
                          isBlurred && "blur opacity-80"
                        )}
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
                            className={cn(
                              "object-cover w-full h-full",
                              isBlurred && "blur opacity-80"
                            )}
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
                          className={cn(
                            "object-cover w-full h-full",
                            isBlurred && "blur opacity-80"
                          )}
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
                              className={cn(
                                "object-cover w-full h-full",
                                isBlurred && "blur opacity-80"
                              )}
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
                        className={cn(
                          "object-cover w-full h-full",
                          isBlurred && "blur opacity-80"
                        )}
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
                            className={cn(
                              "object-cover w-full h-full",
                              isBlurred && "blur opacity-80"
                            )}
                          />
                        </div>
                      ))}
                      {images.length > 3 && (
                        <div className="relative rounded-lg overflow-hidden bg-black/50">
                          <img
                            src={images[3].file_url}
                            alt="Post media 4"
                            className={cn(
                              "object-cover w-full h-full opacity-60",
                              isBlurred && "blur opacity-40"
                            )}
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
                        className={cn(
                          "flex flex-col items-center gap-2 group",
                          isBlurred && "blur opacity-80 pointer-events-none"
                        )}
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
          <div className="relative">
            <div
              className={cn(
                "prose prose-sm max-w-none text-sm",
                isFeedView
                  ? "text-muted-foreground/60 max-h-[10rem] overflow-hidden"
                  : "text-foreground/90",
                isBlurred &&
                  "blur select-none opacity-80 pointer-events-none text-foreground/80 [text-shadow:none]"
              )}
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
            {/* Fadeout gradient - only in feed view and when not blurred */}
            {isFeedView && !isBlurred && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            )}
          </div>

          {/* Blur overlay for anonymous users */}
          {isBlurred && (
            <div className="absolute inset-0 flex items-end justify-center pb-4">
              <Button asChild variant="outline">
                <Link href="/auth/signup">
                  <Eye className="mr-2 h-4 w-4" />
                  Voir plus
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="pt-3 my-0 py-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {/* Impressions - replacing votes */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center bg-blue-50 text-blue-500 rounded-full px-3 py-1 gap-2 cursor-help">
                      <Icon icon="mdi:eye" className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {post.impressions}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {post.impressions}{" "}
                      {post.impressions === 1
                        ? "utilisateur a"
                        : "utilisateurs ont"}{" "}
                      consulté cet entretien
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Share */}
              <DropdownMenu open={shareOpen} onOpenChange={setShareOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isBlurred}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="bg-muted-foreground/5 hover:bg-muted-foreground/10 cursor-pointer rounded-full px-3 gap-2"
                  >
                    <Icon icon="majesticons:share" className="h-4 w-4" />
                    <span className="text-sm font-normal">Partager</span>
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

              {/* Report */}
              <Button
                variant="ghost"
                size="sm"
                disabled={isBlurred}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setReportOpen(true);
                }}
                className="bg-muted-foreground/5 hover:bg-muted-foreground/10 cursor-pointer rounded-full px-3 gap-2"
                title="Signaler cette publication"
              >
                <Icon icon="material-symbols:flag" className="h-4 w-4" />
                <span className="text-sm font-normal">Signaler</span>
              </Button>
            </div>

            {/* User info on the right */}
            <div
              className={cn(
                "flex items-center gap-2",
                isBlurred && "blur select-none pointer-events-none"
              )}
            >
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
        </div>
      )}

      {/* Report Dialog */}
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        postId={post.id}
        postTitle={post.title}
      />
    </div>
  );
}
