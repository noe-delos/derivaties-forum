/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { CheckCircle } from "lucide-react";
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
import { PurchaseDialog } from "./purchase-dialog";

interface PostCardProps {
  post: Post;
  isBlurred?: boolean;
  showActions?: boolean;
  expanded?: boolean;
  className?: string;
  isAuthenticated?: boolean;
  profile?: any;
  isFeedView?: boolean;
  isPurchased?: boolean;
  onPurchase?: (
    postId: string,
    contentType: "interview" | "correction"
  ) => void;
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
  isFeedView = false,
  isPurchased = false,
  onPurchase,
}: PostCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseType, setPurchaseType] = useState<"interview" | "correction">(
    "interview"
  );
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

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/forum/post/${post.id}`
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
    router.push(`/forum/post/${post.id}`);
  };

  const displayContent = expanded
    ? post.content
    : post.content.length > 200
    ? post.content.substring(0, 200) + "..."
    : post.content;

  // Determine if content should be blurred based on authentication and purchase status
  const shouldBlurContent = isAuthenticated ? !isPurchased : true;
  const finalIsBlurred = isBlurred || shouldBlurContent;

  const handlePurchaseClick = (contentType: "interview" | "correction") => {
    setPurchaseType(contentType);
    setPurchaseOpen(true);
  };

  const handlePurchaseSuccess = () => {
    if (onPurchase) {
      onPurchase(post.id, purchaseType);
    }
  };

  return (
    <div
      className={cn(
        "w-full hover:border-muted-foreground/20 hover:cursor-pointer transition-colors p-7 border border-muted-foreground/10 shadow-soft rounded-[1.5rem] flex flex-col",
        isFeedView && "h-fit min-h-[17rem] ", // Fixed height for grid view
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
            {/* Correction checkmark */}
            <Badge
              className={cn(
                "text-xs px-3 py-2 rounded-lg font-medium",
                categoryColors[post.category] || categoryColors.general,
                isFeedView && "text-[0.65rem] py-1"
              )}
            >
              {getCategoryLabel(post.category)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "flex items-center py-2 px-3 gap-1 text-sm font-semibold rounded-lg",
                isFeedView && "text-[0.65rem] py-1"
              )}
            >
              {getCityLabel(post.city)}
            </Badge>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "pt-0 my-0 py-0 pb-3",
          isFeedView && "flex-1 flex flex-col"
        )}
      >
        <div
          className={cn(
            "space-y-2",
            isFeedView && "flex-1 flex flex-col",
            finalIsBlurred && "relative"
          )}
        >
          {expanded ? (
            <h1 className="font-medium text-2xl flex items-center gap-2">
              {post.title}
            </h1>
          ) : (
            <h3
              className={cn(
                "font-medium hover:text-primary transition-colors cursor-pointer flex items-center gap-2",
                isFeedView ? "text-lg" : "text-[1.4rem]" // Smaller title in feed view
              )}
            >
              {post.title}
              {post.corrected && (
                <Icon
                  icon="material-symbols:verified-rounded"
                  className={cn(
                    "text-blue-500 flex-shrink-0",
                    isFeedView ? "h-4 w-4" : "h-5 w-5"
                  )}
                />
              )}
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
                        className="object-cover size-[50%] rounded-lg"
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
                          className={cn(
                            "object-cover w-full h-full",
                            finalIsBlurred && "blur opacity-80"
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
                                finalIsBlurred && "blur opacity-80"
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
          <div className={cn("relative", isFeedView && "flex-1 flex flex-col")}>
            <div
              className={cn(
                "prose prose-sm max-w-none",
                isFeedView
                  ? "text-muted-foreground/60 text-xs flex-1 overflow-hidden" // Smaller text in feed view
                  : "text-foreground/90 text-sm",
                finalIsBlurred &&
                  "blur select-none opacity-80 pointer-events-none text-foreground/80 [text-shadow:none]"
              )}
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
            {/* Fadeout gradient - only in feed view and when not blurred */}
            {isFeedView && !finalIsBlurred && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            )}
          </div>

          {/* Blur overlay for users without access */}
          {finalIsBlurred && (
            <div
              className={cn(
                "absolute mb-4 inset-0 flex items-end justify-center pb-4",
                !isFeedView && "mb-20"
              )}
            >
              {!isAuthenticated ? (
                <Button className="shadow-lg rounded-xl w-fit bg-gradient-to-r from-zinc-500 to-zinc-900 text-white border-0">
                  <Link href="/auth/signup" className="flex items-center gap-1">
                    <Icon icon="iconamoon:eye-fill" className="mr-2 h-4 w-4" />
                    Voir
                  </Link>
                </Button>
              ) : !isFeedView ? (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handlePurchaseClick("interview")}
                    className="shadow-soft border-blue-200 border rounded-md text-blue-600 gap-2"
                  >
                    <Icon icon="ic:baseline-lock" className="h-4 w-4" />
                    Débloquer
                  </Button>
                </div>
              ) : (
                <div className="border shadow-soft border-border rounded-lg p-2 bg-white/90 backdrop-blur-sm">
                  <Icon
                    icon="ic:baseline-lock"
                    className="size-4 text-zinc-700"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div
          className={cn(
            "pt-3 my-0 py-0",
            isFeedView && "mt-auto flex-shrink-0"
          )}
        >
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">par</span>
              <Link
                href={`/forum/profile/${post.user?.id}`}
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

      {/* Purchase Dialog */}
      {isAuthenticated && profile && (
        <PurchaseDialog
          open={purchaseOpen}
          onOpenChange={setPurchaseOpen}
          postId={post.id}
          contentType={purchaseType}
          postTitle={post.title}
          userTokens={profile.tokens || 0}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
}
