"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Calendar, User as UserIcon } from "lucide-react";
import { getSelectedCorrectionForPost } from "@/lib/services/corrections";
import { Correction, Post } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface CorrectionDisplayProps {
  post: Post;
  isAuthenticated: boolean;
}

export function CorrectionDisplay({ post, isAuthenticated }: CorrectionDisplayProps) {
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCorrection();
  }, [post.id, isAuthenticated]);

  const loadCorrection = async () => {
    try {
      const selectedCorrection = await getSelectedCorrectionForPost(post.id, isAuthenticated);
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

  const getUserInitials = () => {
    if (correction.user?.first_name && correction.user?.last_name) {
      return `${correction.user.first_name[0]}${correction.user.last_name[0]}`.toUpperCase();
    }
    if (correction.user?.username) {
      return correction.user.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (correction.user?.first_name && correction.user?.last_name) {
      return `${correction.user.first_name} ${correction.user.last_name}`;
    }
    return correction.user?.username || "Utilisateur";
  };

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">
              Correction validée
            </h3>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Solution officielle
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Correction content */}
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-foreground">
              {correction.content}
            </div>
          </div>

          {/* Author info */}
          <div className="flex items-center justify-between pt-4 border-t border-green-200">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={correction.user?.profile_picture_url} 
                  alt={getUserDisplayName()} 
                />
                <AvatarFallback className="bg-green-100 text-green-700">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-900">
                    {getUserDisplayName()}
                  </span>
                  {correction.user?.role === 'moderator' && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                      Modérateur
                    </Badge>
                  )}
                  {correction.user?.role === 'admin' && (
                    <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(correction.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </div>
                  {correction.tokens_awarded > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-600">
                        +{correction.tokens_awarded} tokens gagnés
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}