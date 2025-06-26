/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { UserProfile } from "@/lib/services/profile";
import { updateProfileAction } from "@/lib/actions/profile";
import { getUserDisplayName, getUserInitials } from "@/lib/utils";

const editProfileSchema = z.object({
  first_name: z.string().max(50, "Prénom trop long").optional(),
  last_name: z.string().max(50, "Nom trop long").optional(),
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(30, "Nom d'utilisateur trop long")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscore"
    )
    .optional()
    .or(z.literal("")),
  bio: z.string().max(500, "Bio trop longue").optional(),
  job_title: z.string().max(100, "Titre trop long").optional(),
  location: z.string().max(100, "Localisation trop longue").optional(),
  school: z.string().max(100, "École trop longue").optional(),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

interface EditProfileDialogProps {
  profile: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({
  profile,
  open,
  onOpenChange,
}: EditProfileDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const form = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      username: profile.username || "",
      bio: profile.bio || "",
      job_title: profile.job_title || "",
      location: profile.location || "",
      school: profile.school || "",
    },
  });

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("L'image ne peut pas dépasser 5MB");
        return;
      }
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error("L'image ne peut pas dépasser 10MB");
        return;
      }
      setBanner(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: EditProfileForm) => {
    try {
      setIsLoading(true);

      const result = await updateProfileAction({
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        bio: data.bio,
        job_title: data.job_title,
        location: data.location,
        school: data.school,
        profile_picture: profilePicture,
        banner: banner,
      });

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (profilePicturePreview) URL.revokeObjectURL(profilePicturePreview);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
          <DialogDescription>
            Mettez à jour vos informations de profil
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Banner Upload */}
          <div className="space-y-2">
            <Label>Bannière de profil</Label>
            <Card>
              <CardContent className="p-0">
                <div
                  className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg relative overflow-hidden cursor-pointer group"
                  style={{
                    backgroundImage:
                      bannerPreview || profile.banner_url
                        ? `url(${bannerPreview || profile.banner_url})`
                        : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  onClick={() =>
                    document.getElementById("banner-input")?.click()
                  }
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  {bannerPreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBanner(null);
                        setBannerPreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            <input
              id="banner-input"
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              Recommandé: 1200x320px, maximum 10MB
            </p>
          </div>

          {/* Profile Picture Upload */}
          <div className="space-y-2">
            <Label>Photo de profil</Label>
            <div className="flex items-center gap-4">
              <div
                className="relative cursor-pointer group"
                onClick={() => document.getElementById("avatar-input")?.click()}
              >
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={profilePicturePreview || profile.profile_picture_url}
                    alt={getUserDisplayName(profile)}
                  />
                  <AvatarFallback className="text-lg">
                    {getUserInitials(profile)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("avatar-input")?.click()
                  }
                >
                  Changer la photo
                </Button>
                {profilePicturePreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setProfilePicture(null);
                      setProfilePicturePreview(null);
                    }}
                    className="ml-2"
                  >
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              Recommandé: 400x400px, maximum 5MB
            </p>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                placeholder="Votre prénom"
                {...form.register("first_name")}
              />
              {form.formState.errors.first_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                placeholder="Votre nom"
                {...form.register("last_name")}
              />
              {form.formState.errors.last_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              placeholder="nom_utilisateur"
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-sm text-destructive">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Parlez-nous de vous..."
              rows={3}
              {...form.register("bio")}
            />
            {form.formState.errors.bio && (
              <p className="text-sm text-destructive">
                {form.formState.errors.bio.message}
              </p>
            )}
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job_title">Titre professionnel</Label>
              <Input
                id="job_title"
                placeholder="ex: Analyste Financier"
                {...form.register("job_title")}
              />
              {form.formState.errors.job_title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.job_title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school">École/Université</Label>
                <Input
                  id="school"
                  placeholder="ex: HEC Paris"
                  {...form.register("school")}
                />
                {form.formState.errors.school && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.school.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  placeholder="ex: Paris, France"
                  {...form.register("location")}
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
