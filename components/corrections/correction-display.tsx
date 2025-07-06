"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { getSelectedCorrectionForPost } from "@/lib/services/corrections";
import { Correction, Post } from "@/lib/types";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface CorrectionDisplayProps {
  post: Post;
  isAuthenticated: boolean;
  isPurchased?: boolean;
  onPurchase?: (postId: string, contentType: "correction") => void;
}

export function CorrectionDisplay({
  post,
  isAuthenticated,
  isPurchased = false,
  onPurchase,
}: CorrectionDisplayProps) {
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we already have the correction data from the post
    if (post.selected_correction && post.selected_correction.length > 0) {
      const selectedCorrection = post.selected_correction.find(
        (c) => c.status === "approved"
      );
      if (selectedCorrection) {
        setCorrection(selectedCorrection);
        setIsLoading(false);
        return;
      }
    }

    // Fallback to fetching if not available in post data
    loadCorrection();
  }, [post.id, post.selected_correction, isAuthenticated]);

  const loadCorrection = async () => {
    try {
      const selectedCorrection = await getSelectedCorrectionForPost(
        post.id,
        isAuthenticated
      );
      setCorrection(selectedCorrection);
    } catch (error) {
      console.error("Error loading correction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!correction) {
    return null;
  }

  return (
    <Card className="border-gray-200 bg-gray-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Correction validée
            </h3>
            <Icon
              icon="material-symbols:verified-rounded"
              className="h-5 w-5 text-blue-500"
            />
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Solution officielle
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Correction content */}
          <div
            className={cn(
              "prose prose-sm max-w-none relative",
              !isPurchased && "min-h-[200px]"
            )}
          >
            <div
              className={cn(
                "whitespace-pre-wrap text-foreground",
                !isPurchased &&
                  "blur select-none opacity-80 pointer-events-none"
              )}
              dangerouslySetInnerHTML={{ __html: correction.content }}
            />

            {/* Purchase overlay for correction */}
            {!isPurchased && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="outline"
                  onClick={() => onPurchase?.(post.id, "correction")}
                  className="shadow-soft border-blue-200 border rounded-md text-blue-600 gap-2"
                >
                  <Icon icon="ic:baseline-lock" className="h-4 w-4" />
                  Débloquer
                </Button>
              </div>
            )}
          </div>

          {/* Validé par Derivatives badge */}
          <div className="flex justify-end items-center gap-2 text-xs text-muted-foreground pt-4  border-gray-200">
            <span>Validé par Derivatives</span>
            <img
              src="/derivaties.png"
              alt="Derivatives Logo"
              className="h-5 w-5 object-contain"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
