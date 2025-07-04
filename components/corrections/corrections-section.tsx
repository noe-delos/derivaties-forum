"use client";

import { Post, User } from "@/lib/types";
import { CorrectionForm } from "./correction-form";
import { CorrectionDisplay } from "./correction-display";

interface CorrectionsSectionProps {
  post: Post;
  user: User | null;
  isAuthenticated: boolean;
}

export function CorrectionsSection({
  post,
  user,
  isAuthenticated,
}: CorrectionsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {post.corrected ? "Correction" : "Corrections"}
        </h2>
        
        {/* Display approved correction if exists */}
        {post.corrected && (
          <div className="mb-6">
            <CorrectionDisplay post={post} isAuthenticated={isAuthenticated} />
          </div>
        )}

        {/* Only show form if no correction is selected yet */}
        {!post.corrected && (
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