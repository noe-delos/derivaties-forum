import { CorrectionsManagement } from "@/components/admin/corrections-management";

export default function CorrectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des corrections</h1>
        <p className="text-muted-foreground">
          Examinez et validez les corrections soumises par les utilisateurs.
        </p>
      </div>
      <CorrectionsManagement />
    </div>
  );
}