"use client";

import { useState, useCallback } from "react";
import { Post, User } from "@/lib/types";
import { CorrectionsSection } from "./corrections-section";
import { PurchaseDialog } from "../posts/purchase-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface CorrectionsSectionWrapperProps {
  post: Post;
  user: User | null;
  isAuthenticated: boolean;
  isCorrectionPurchased: boolean;
  userTokens: number;
}

export function CorrectionsSectionWrapper({
  post,
  user,
  isAuthenticated,
  isCorrectionPurchased,
  userTokens,
}: CorrectionsSectionWrapperProps) {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'correction'>('correction');
  const [isPurchased, setIsPurchased] = useState(isCorrectionPurchased);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const handlePurchase = useCallback(
    async (postId: string, contentType: 'correction') => {
      setPurchaseType(contentType);
      setPurchaseOpen(true);
    },
    []
  );

  const handlePurchaseSuccess = useCallback(async () => {
    // Update purchased state immediately
    setIsPurchased(true);
    
    // Refresh queries
    queryClient.invalidateQueries({ queryKey: ["user"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("refresh-auth"));
    }
  }, [queryClient]);

  return (
    <>
      <CorrectionsSection
        post={post}
        user={user}
        isAuthenticated={isAuthenticated}
        isPurchased={isPurchased}
        onPurchase={handlePurchase}
      />
      
      {/* Purchase Dialog */}
      {isAuthenticated && user && (
        <PurchaseDialog
          open={purchaseOpen}
          onOpenChange={setPurchaseOpen}
          postId={post.id}
          contentType={purchaseType}
          postTitle={post.title}
          userTokens={userTokens}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
    </>
  );
}