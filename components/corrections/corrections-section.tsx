"use client";

import { useEffect } from "react";
import { Post, User } from "@/lib/types";
import { CorrectionForm } from "./correction-form";
import { CorrectionDisplay } from "./correction-display";
import { debugCorrectionsForPost } from "@/lib/services/corrections";

interface CorrectionsSectionProps {
  post: Post;
  user: User | null;
  isAuthenticated: boolean;
  isPurchased?: boolean;
  onPurchase?: (postId: string, contentType: 'correction') => void;
}

export function CorrectionsSection({
  post,
  user,
  isAuthenticated,
  isPurchased = false,
  onPurchase,
}: CorrectionsSectionProps) {
  useEffect(() => {
    if (post.id) {
      debugCorrectionsForPost(post.id);
    }
  }, [post.id]);

  // Check if there are any approved corrections (regardless of is_selected status)
  const hasApprovedCorrection =
    post.selected_correction &&
    post.selected_correction.some((c) => c.status === "approved");

  return (
    <div className="space-y-6 mt-10">
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {hasApprovedCorrection ? "Correction" : "Corrections"}
        </h2>

        {/* Display approved correction if exists */}
        {hasApprovedCorrection && (
          <div className="mb-6">
            <CorrectionDisplay 
              post={post} 
              isAuthenticated={isAuthenticated} 
              isPurchased={isPurchased}
              onPurchase={onPurchase}
            />
          </div>
        )}

        {/* Only show form if no correction is approved yet */}
        {!hasApprovedCorrection && (
          <CorrectionForm
            post={post}
            user={user}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>
    </div>
  );
}
