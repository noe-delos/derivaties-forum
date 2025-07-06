"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, File, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  label?: string;
  description?: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

export function FileUpload({
  onFilesChange,
  maxFiles = 5,
  acceptedTypes = ["image/*", "video/*", ".pdf", ".doc", ".docx"],
  maxSize = 10,
  label = "Télécharger des fichiers",
  description = "Glissez-déposez vos fichiers ici ou cliquez pour sélectionner",
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);

      // Create preview URLs for images
      const filesWithPreviews = newFiles.map((file) => {
        const fileWithPreview = file as FileWithPreview;
        if (file.type.startsWith("image/") && !fileWithPreview.preview) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }
        return fileWithPreview;
      });

      setFiles(filesWithPreviews);
      onFilesChange(filesWithPreviews);
    },
    [files, maxFiles, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxSize * 1024 * 1024,
    maxFiles,
  });

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      // eslint-disable-next-line jsx-a11y/alt-text
      return <Image className="h-4 w-4" />;
    }
    if (file.type.startsWith("video/")) {
      return <Video className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImageFile = (file: File) => file.type.startsWith("image/");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">{label}</label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm text-primary">
                Déposez les fichiers ici...
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm">
                  Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum {maxFiles} fichiers, {maxSize}MB par fichier
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Previews Grid */}
      {files.filter(isImageFile).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Aperçu des images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {files.filter(isImageFile).map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={file.preview}
                    className="w-full h-full object-cover"
                    alt={`Aperçu de ${file.name}`}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(files.indexOf(file))}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="mt-1">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Files List */}
      {files.filter((file) => !isImageFile(file)).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Autres fichiers</h4>
          <div className="space-y-2">
            {files
              .filter((file) => !isImageFile(file))
              .map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file)}
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(files.indexOf(file))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
