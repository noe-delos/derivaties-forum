"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Edit,
  User as UserIcon
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  getPendingCorrections, 
  getCorrectionById,
  updateCorrectionStatus,
  getCorrectionStats
} from "@/lib/services/corrections";
import { Correction } from "@/lib/types";
import { useAuth } from "@/lib/providers/auth-provider";

export function CorrectionsManagement() {
  const { profile } = useAuth();
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [selectedCorrection, setSelectedCorrection] = useState<Correction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderatorNote, setModeratorNote] = useState("");
  const [tokensAwarded, setTokensAwarded] = useState(15);
  const [isSelected, setIsSelected] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  useEffect(() => {
    loadCorrections();
    loadStats();
  }, []);

  const loadCorrections = async () => {
    try {
      const data = await getPendingCorrections(true);
      setCorrections(data);
    } catch (error) {
      console.error("Error loading corrections:", error);
      toast.error("Erreur lors du chargement des corrections");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getCorrectionStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleViewCorrection = async (correctionId: string) => {
    try {
      const correction = await getCorrectionById(correctionId, true);
      setSelectedCorrection(correction);
      setModeratorNote("");
      setTokensAwarded(15);
      setIsSelected(false);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error loading correction:", error);
      toast.error("Erreur lors du chargement de la correction");
    }
  };

  const handleApprove = async () => {
    if (!selectedCorrection || !profile) return;

    setIsSubmitting(true);
    try {
      await updateCorrectionStatus(
        selectedCorrection.id,
        {
          status: "approved",
          moderator_note: moderatorNote,
          tokens_awarded: tokensAwarded,
          is_selected: isSelected,
        },
        profile.id,
        true
      );

      toast.success("Correction approuvée avec succès");
      setIsDialogOpen(false);
      loadCorrections();
      loadStats();
    } catch (error) {
      console.error("Error approving correction:", error);
      toast.error("Erreur lors de l'approbation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCorrection || !profile) return;

    setIsSubmitting(true);
    try {
      await updateCorrectionStatus(
        selectedCorrection.id,
        {
          status: "rejected",
          moderator_note: moderatorNote,
        },
        profile.id,
        true
      );

      toast.success("Correction rejetée");
      setIsDialogOpen(false);
      loadCorrections();
      loadStats();
    } catch (error) {
      console.error("Error rejecting correction:", error);
      toast.error("Erreur lors du rejet");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    return user?.username || "Utilisateur";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approuvées</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejetées</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Corrections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Corrections en attente</CardTitle>
        </CardHeader>
        <CardContent>
          {corrections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune correction en attente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Soumise</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corrections.map((correction) => (
                  <TableRow key={correction.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={correction.user?.profile_picture_url} 
                            alt={getUserDisplayName(correction.user)} 
                          />
                          <AvatarFallback>
                            {getUserInitials(correction.user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {getUserDisplayName(correction.user)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {correction.user?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-sm truncate">
                          {correction.post?.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {correction.post?.category} • {correction.post?.type}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {formatDistanceToNow(new Date(correction.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        {correction.status === 'pending' ? 'En attente' : correction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCorrection(correction.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Examiner
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Examiner la correction</DialogTitle>
            <DialogDescription>
              Examinez la correction et décidez si vous voulez l'approuver ou la rejeter.
            </DialogDescription>
          </DialogHeader>

          {selectedCorrection && (
            <div className="space-y-6">
              {/* Post Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Question originale:</h4>
                <p className="text-sm font-medium">{selectedCorrection.post?.title}</p>
                <div 
                  className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: selectedCorrection.post?.content || '' }}
                />
              </div>

              {/* Correction Content */}
              <div>
                <h4 className="font-medium mb-2">Correction proposée:</h4>
                <div className="bg-white border rounded-lg p-4">
                  <div 
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: selectedCorrection.content || '' }}
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Avatar>
                  <AvatarImage 
                    src={selectedCorrection.user?.profile_picture_url} 
                    alt={getUserDisplayName(selectedCorrection.user)} 
                  />
                  <AvatarFallback>
                    {getUserInitials(selectedCorrection.user)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getUserDisplayName(selectedCorrection.user)}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCorrection.user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tokens actuels: {selectedCorrection.user?.tokens}
                  </p>
                </div>
              </div>

              {/* Moderation Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tokens">Tokens à attribuer (si approuvé)</Label>
                  <Input
                    id="tokens"
                    type="number"
                    value={tokensAwarded}
                    onChange={(e) => setTokensAwarded(Number(e.target.value))}
                    min="0"
                    max="50"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isSelected"
                    checked={isSelected}
                    onChange={(e) => setIsSelected(e.target.checked)}
                  />
                  <Label htmlFor="isSelected">
                    Marquer comme correction officielle (visible sur le post)
                  </Label>
                </div>

                <div>
                  <Label htmlFor="note">Note de modération (optionnelle)</Label>
                  <Textarea
                    id="note"
                    placeholder="Ajoutez une note pour l'utilisateur..."
                    value={moderatorNote}
                    onChange={(e) => setModeratorNote(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}