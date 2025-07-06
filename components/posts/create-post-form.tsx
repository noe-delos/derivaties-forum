"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, X, ChevronDownIcon, Sparkles } from "lucide-react";
import { Icon } from "@iconify/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { FileUpload } from "@/components/ui/file-upload";
import { POST_CATEGORIES, POST_TYPES, Bank } from "@/lib/types";
import {
  createPostServer,
  uploadPostMedia,
  linkPostMedia,
} from "@/lib/actions/posts";
import { fetchBanks } from "@/lib/services/banks";
import { generateTags } from "@/lib/services/ai-tags";
import { cn } from "@/lib/utils";

const createPostSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères"),
  category: z.enum([
    "entretien_sales_trading",
    "conseils_ecole",
    "stage_summer_graduate",
    "quant_hedge_funds",
  ]),
  type: z.enum([
    "question",
    "retour_experience",
    "transcript_entretien",
    "fichier_attache",
  ]),
  bank_id: z.string().min(1, "Vous devez sélectionner une banque"),
  tags: z.array(z.string()).min(2, "Au moins deux tags sont requis"),
  city: z.string().min(1, "Vous devez sélectionner une ville"),
  custom_city: z.string().optional(),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

interface CreatePostFormProps {
  userId: string;
}

const RequiredAsterisk = () => <span className="text-destructive ml-1">*</span>;

const CITIES = {
  paris: "Paris",
  london: "Londres",
  new_york: "New York",
  hong_kong: "Hong Kong",
  singapore: "Singapour",
  dubai: "Dubaï",
  frankfurt: "Francfort",
  tokyo: "Tokyo",
  zurich: "Zurich",
  toronto: "Toronto",
} as const;

interface BankSingleSelectProps {
  banks: Bank[];
  selectedBankId: string;
  onBankSelect: (bankId: string) => void;
  isLoading: boolean;
  error?: string;
}

function BankSingleSelect({
  banks,
  selectedBankId,
  onBankSelect,
  isLoading,
  error,
}: BankSingleSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedBank = banks.find((bank) => bank.id === selectedBankId);

  const renderTrigger = () => {
    if (!selectedBank) {
      return (
        <span className="text-muted-foreground text-sm">
          Sélectionner une banque
        </span>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          <img
            src={selectedBank.logo_url}
            alt={selectedBank.name}
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-sm font-medium">{selectedBank.name}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 border rounded-xl">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground ml-2">
          Chargement...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select open={open} onOpenChange={setOpen}>
        <SelectTrigger
          className="w-fit justify-between py-6 px-4 rounded-xl shadow-soft hover:cursor-pointer hover:bg-muted"
          onClick={() => setOpen(!open)}
        >
          {renderTrigger()}
          <ChevronDownIcon className="size-4 opacity-50" />
        </SelectTrigger>
        <SelectContent className="w-fit">
          <div className="max-h-[300px] overflow-y-auto">
            {banks.map((bank) => {
              const isSelected = selectedBankId === bank.id;
              return (
                <div
                  key={bank.id}
                  className="relative flex w-full cursor-pointer items-center gap-3 rounded-sm py-1.5 px-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    onBankSelect(bank.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center justify-center w-4 h-4">
                    {isSelected && (
                      <Icon icon="mdi:check" className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={bank.logo_url}
                      alt={bank.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="flex-1 text-sm font-medium">
                    {bank.name}
                  </span>
                </div>
              );
            })}
          </div>
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function CreatePostForm({ userId }: CreatePostFormProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [customCityInput, setCustomCityInput] = useState("");
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      category: "entretien_sales_trading",
      type: "question",
      bank_id: "",
      tags: [],
      city: "paris",
      custom_city: "",
    },
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;
  const tags = watch("tags");
  const selectedBankId = watch("bank_id");
  const selectedCity = watch("city");
  const title = watch("title");
  const category = watch("category");
  const type = watch("type");

  // Fetch banks on component mount
  useEffect(() => {
    async function loadBanks() {
      try {
        const banksData = await fetchBanks();
        setBanks(banksData);
      } catch (error) {
        console.error("Error loading banks:", error);
        toast.error("Erreur lors du chargement des banques");
      } finally {
        setBanksLoading(false);
      }
    }
    loadBanks();
  }, []);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== tag)
    );
  };

  const selectBank = (bankId: string) => {
    setValue("bank_id", bankId);
  };

  const generateAITags = async () => {
    if (!title || !category) {
      toast.error("Veuillez remplir le titre et sélectionner une catégorie d'abord");
      return;
    }

    try {
      setIsGeneratingTags(true);
      
      const selectedBank = banks.find(bank => bank.id === selectedBankId);
      const bankName = selectedBank?.name;
      
      const generatedTags = await generateTags({
        title,
        category,
        bankName,
        type,
      });

      // Add generated tags to existing tags, avoiding duplicates
      const newTags = [...new Set([...tags, ...generatedTags])];
      setValue("tags", newTags);
      
      toast.success(`${generatedTags.length} tags générés par IA !`);
    } catch (error) {
      console.error("Error generating tags:", error);
      toast.error("Erreur lors de la génération des tags");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const onSubmit = async (formData: CreatePostForm) => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      const textContent = content.replace(/<[^>]*>/g, "").trim();
      if (textContent.length < 10) {
        toast.error("Le contenu doit contenir au moins 10 caractères");
        setIsLoading(false);
        return;
      }

      const { post } = await createPostServer({
        title: formData.title,
        content,
        category: formData.category,
        type: formData.type,
        bank_id: formData.bank_id,
        tags: formData.tags,
        is_public: true,
        userId,
        city:
          formData.city === "autre"
            ? formData.custom_city || "autre"
            : formData.city,
      });

      if (mediaFiles.length > 0 || documentFiles.length > 0) {
        const uploadPromises = [
          ...mediaFiles.map(async (file) => {
            const { fileUrl } = await uploadPostMedia(
              userId,
              file,
              "post-media"
            );
            return {
              file_url: fileUrl,
              file_name: file.name,
              file_type: file.type.startsWith("image/") ? "image" : "video",
              file_size: file.size,
            };
          }),
          ...documentFiles.map(async (file) => {
            const { fileUrl } = await uploadPostMedia(
              userId,
              file,
              "post-files"
            );
            return {
              file_url: fileUrl,
              file_name: file.name,
              file_type: "document",
              file_size: file.size,
            };
          }),
        ];

        const uploadedFiles = await Promise.all(uploadPromises);
        await linkPostMedia(post.id, uploadedFiles);
      }

      toast.info("Publication envoyé pour vérification !");
      router.push("/forum");
      router.refresh();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Erreur lors de la création de la publication");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre
              <RequiredAsterisk />
            </Label>
            <Input
              id="title"
              placeholder="Titre de votre publication..."
              className="py-6 rounded-2xl transition-shadow cursor-pointer placeholder:text-foreground/20"
              {...form.register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Bank Selection */}
          <div className="space-y-2">
            <Label>
              Banque
              <RequiredAsterisk />
            </Label>
            <BankSingleSelect
              banks={banks}
              selectedBankId={selectedBankId}
              onBankSelect={selectBank}
              isLoading={banksLoading}
              error={errors.bank_id?.message}
            />
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Catégorie
                <RequiredAsterisk />
              </Label>
              <Select
                value={watch("category")}
                onValueChange={(value: CreatePostForm["category"]) =>
                  setValue("category", value)
                }
              >
                <SelectTrigger className="py-6 rounded-2xl shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer">
                  <SelectValue />
                  <ChevronDownIcon className="size-4 opacity-50" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POST_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {String(label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Type de publication
                <RequiredAsterisk />
              </Label>
              <Select
                value={watch("type")}
                onValueChange={(value: CreatePostForm["type"]) =>
                  setValue("type", value)
                }
              >
                <SelectTrigger className="py-6 rounded-2xl shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer">
                  <SelectValue />
                  <ChevronDownIcon className="size-4 opacity-50" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POST_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {String(label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label>
              Ville
              <RequiredAsterisk />
            </Label>
            <Select
              value={selectedCity}
              onValueChange={(value) => {
                setValue("city", value);
                if (value !== "autre") {
                  setCustomCityInput("");
                  setValue("custom_city", "");
                }
              }}
            >
              <SelectTrigger className="py-6 rounded-2xl shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer">
                <SelectValue />
                <ChevronDownIcon className="size-4 opacity-50" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CITIES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
            {selectedCity === "autre" && (
              <Input
                placeholder="Entrez le nom de la ville..."
                value={customCityInput}
                onChange={(e) => {
                  setCustomCityInput(e.target.value);
                  setValue("custom_city", e.target.value);
                }}
                className="py-6 rounded-2xl shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer placeholder:text-foreground/20"
              />
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>
              Tags (minimum 2)
              <RequiredAsterisk />
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter un tag et appuyer sur Entrée..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 py-6 rounded-2xl shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer placeholder:text-foreground/20"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateAITags}
                disabled={!title || !category || isGeneratingTags}
                className="py-6 px-4 rounded-2xl shadow-soft hover:shadow-soft-md transition-shadow whitespace-nowrap"
              >
                {isGeneratingTags ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Générer par IA
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 py-2 px-3 rounded-xl"
                  >
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            {errors.tags && (
              <p className="text-sm text-destructive">{errors.tags.message}</p>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu</CardTitle>
        </CardHeader>
        <CardContent>
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Écrivez le contenu de votre publication..."
          />
        </CardContent>
      </Card>

      {/* Media Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Images et vidéos</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFilesChange={setMediaFiles}
            maxFiles={5}
            acceptedTypes={["image/*", "video/*"]}
            maxSize={10}
            label="Télécharger des médias"
            description="Ajoutez des images ou des vidéos à votre publication"
          />
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFilesChange={setDocumentFiles}
            maxFiles={3}
            acceptedTypes={[".pdf", ".doc", ".docx"]}
            maxSize={10}
            label="Télécharger des documents"
            description="Ajoutez des documents à votre publication"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Publication en cours..." : "Publier"}
        </Button>
      </div>
    </form>
  );
}
