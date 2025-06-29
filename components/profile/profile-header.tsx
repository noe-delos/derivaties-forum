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
      <Card className="mb-4">
        <div className="relative">
          {/* Banner */}
          <div
            className="h-24 md:h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg"
            style={{
              backgroundImage: profile.banner_url
                ? `url(${profile.banner_url})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Profile Picture */}
          <div className="absolute -bottom-10 left-4">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarImage
                src={profile.profile_picture_url}
                alt={getUserDisplayName(profile)}
              />
              <AvatarFallback className="text-lg">
                {getUserInitials(profile)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Edit Button */}
          {isOwner && (
            <div className="absolute top-3 right-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="bg-background/80 backdrop-blur-sm text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Modifier
              </Button>
            </div>
          )}
        </div>

        <CardContent className="pt-12 pb-4">
          <div className="space-y-3">
            {/* Name and Basic Info */}
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg md:text-xl font-semibold">
                    {getUserDisplayName(profile)}
                  </h1>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <span className="text-yellow-600">⭐</span>
                    {profile.tokens}
                  </Badge>
                </div>

                {profile.username && (
                  <p className="text-sm text-muted-foreground">
                    @{profile.username}
                  </p>
                )}

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {profile.bio}
                  </p>
                )}

                {/* Details */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {profile.job_title && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      <span>{profile.job_title}</span>
                    </div>
                  )}

                  {profile.school && (
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      <span>{profile.school}</span>
                    </div>
                  )}

                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{profile.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Membre {joinedDate}</span>
                  </div>
                </div>
              </div>

              {/* Statistics - Right Side */}
              <div className="flex gap-4 text-center">
                <div>
                  <div className="text-sm font-semibold">
                    {profile.stats.postsCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>

                <div>
                  <div className="text-sm font-semibold">
                    {profile.stats.totalUpvotes}
                  </div>
                  <div className="text-xs text-muted-foreground">Votes</div>
                </div>

                <div>
                  <div className="text-sm font-semibold">
                    {profile.stats.commentsCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Réponses</div>
                </div>

                <div>
                  <div className="text-sm font-semibold">
                    {profile.stats.approvedPosts}
                  </div>
                  <div className="text-xs text-muted-foreground">Validés</div>
                </div>
              </div>
            </div>

            {/* Owner-only statistics */}
            {isOwner &&
              (profile.stats.pendingPosts > 0 ||
                profile.stats.rejectedPosts > 0) && (
                <div className="flex justify-end gap-4 text-center">
                  {profile.stats.pendingPosts > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-orange-600">
                        {profile.stats.pendingPosts}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Attente
                      </div>
                    </div>
                  )}

                  {profile.stats.rejectedPosts > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-red-600">
                        {profile.stats.rejectedPosts}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Refusés
                      </div>
                    </div>
                  )}
                </div>
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
