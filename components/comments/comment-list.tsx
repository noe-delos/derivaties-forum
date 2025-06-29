/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { Loader2, MessageCircle } from "lucide-react";

import { CommentCard } from "./comment-card";
import { CommentForm } from "./comment-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchComments } from "@/lib/services/comments";
import { useAuth } from "@/lib/providers/auth-provider";
import { useState } from "react";

interface CommentListProps {
  postId: string;
  className?: string;
}

export function CommentList({ postId, className }: CommentListProps) {
  const { isAuthenticated, profile } = useAuth();
  const { ref, inView } = useInView();
  const [activeEditor, setActiveEditor] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["comments", postId, isAuthenticated],
    queryFn: ({ pageParam = 0 }) =>
      fetchComments({
        postId,
        pageParam,
        isAuthenticated,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const comments = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Erreur lors du chargement des commentaires.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Commentaires ({comments.length})
        </h3>
        {isAuthenticated && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setActiveEditor(activeEditor === "main" ? null : "main")
            }
          >
            {activeEditor === "main" ? "Annuler" : "Commenter"}
          </Button>
        )}
      </div>

      {activeEditor === "main" && isAuthenticated && (
        <div className="mb-6">
          <CommentForm
            postId={postId}
            onSuccess={() => setActiveEditor(null)}
          />
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>Aucun commentaire pour le moment.</p>
          {isAuthenticated && (
            <p className="text-sm text-muted-foreground mt-2">
              Soyez le premier à commenter !
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map((comment) => (
            <div className="relative" key={comment.id}>
              {comment.parent_id && (
                <div className="absolute left-0 top-6 bottom-0 w-4 flex items-stretch">
                  <div className="w-px bg-border mx-2 h-full" />
                </div>
              )}
              <div className={comment.parent_id ? "ml-6" : ""}>
                <CommentCard
                  comment={comment}
                  isBlurred={!isAuthenticated}
                  activeEditor={activeEditor}
                  onEditorChange={setActiveEditor}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
