/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import {
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Edit,
  Mail,
  Link as LinkIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserProfile } from "@/lib/services/profile";
import { USER_ROLES } from "@/lib/types";
import { getUserDisplayName, getUserInitials } from "@/lib/utils";
import { EditProfileDialog } from "./edit-profile-dialog";

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwner: boolean;
  isAuthenticated: boolean;
}

export function ProfileHeader({
  profile,
  isOwner,
  isAuthenticated,
}: ProfileHeaderProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const joinedDate = formatDistanceToNow(new Date(profile.created_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <>
      <Card className="mb-6">
        <div className="relative">
          {/* Banner */}
          <div
            className="h-32 md:h-40 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg"
            style={{
              backgroundImage: profile.banner_url
                ? `url(${profile.banner_url})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-6">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage
                src={profile.profile_picture_url}
                alt={getUserDisplayName(profile)}
              />
              <AvatarFallback className="text-xl">
                {getUserInitials(profile)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Edit Button */}
          {isOwner && (
            <div className="absolute top-4 right-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="bg-background/80 backdrop-blur-sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          )}
        </div>

        <CardContent className="pt-16 pb-6">
          <div className="space-y-4">
            {/* Name and Basic Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold">
                  {getUserDisplayName(profile)}
                </h1>
                {profile.role !== "user" && (
                  <Badge variant="outline">{USER_ROLES[profile.role]}</Badge>
                )}
                <Badge variant="secondary" className="gap-1">
                  <span className="text-yellow-600">⭐</span>
                  {profile.tokens} tokens
                </Badge>
              </div>

              {profile.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <p className="text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Details */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile.job_title && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{profile.job_title}</span>
                </div>
              )}

              {profile.school && (
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>{profile.school}</span>
                </div>
              )}

              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Inscrit {joinedDate}</span>
              </div>
            </div>

            <Separator />

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-primary">
                  {profile.stats.postsCount}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Publications
                </div>
              </div>

              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  {profile.stats.totalUpvotes}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Upvotes reçus
                </div>
              </div>

              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-600">
                  {profile.stats.commentsCount}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Commentaires
                </div>
              </div>

              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-yellow-600">
                  {profile.stats.approvedPosts}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Posts approuvés
                </div>
              </div>
            </div>

            {/* Owner-only statistics */}
            {isOwner &&
              (profile.stats.pendingPosts > 0 ||
                profile.stats.rejectedPosts > 0) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {profile.stats.pendingPosts > 0 && (
                      <div className="text-center">
                        <div className="text-lg md:text-xl font-bold text-orange-600">
                          {profile.stats.pendingPosts}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground">
                          En attente
                        </div>
                      </div>
                    )}

                    {profile.stats.rejectedPosts > 0 && (
                      <div className="text-center">
                        <div className="text-lg md:text-xl font-bold text-red-600">
                          {profile.stats.rejectedPosts}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground">
                          Rejetés
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      {isOwner && (
        <EditProfileDialog
          profile={profile}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
    </>
  );
}
