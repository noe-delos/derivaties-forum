/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/hooks/use-supabase";

const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    linkedinUrl: z
      .string()
      .url("URL LinkedIn invalide")
      .refine((url) => url.includes("linkedin.com"), {
        message: "L'URL doit être un profil LinkedIn valide",
      }),
    phoneNumber: z
      .string()
      .min(10, "Le numéro de téléphone doit contenir au moins 10 caractères")
      .regex(/^[+]?[\d\s\-\(\)]+$/, "Format de numéro de téléphone invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const supabase = useSupabase();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      linkedinUrl: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            linkedin_url: data.linkedinUrl,
            phone_number: data.phoneNumber,
          },
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Compte créé avec succès ! Vous êtes maintenant connecté.");

      // Use window.location for immediate redirect
      window.location.href = "/";
    } catch (error: any) {
      console.error("Signup error:", error);

      if (error.message?.includes("User already registered")) {
        toast.error("Cette adresse email est déjà utilisée");
      } else if (error.message?.includes("Password")) {
        toast.error("Le mot de passe ne respecte pas les critères requis");
      } else {
        toast.error(
          "Erreur lors de la création du compte. Veuillez réessayer."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    Prénom
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Pierre"
                      disabled={isLoading}
                      className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    Nom
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Dupont"
                      disabled={isLoading}
                      className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="votre.email@exemple.com"
                    type="email"
                    disabled={isLoading}
                    className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    Profil LinkedIn <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://linkedin.com/in/votre-profil"
                      type="url"
                      disabled={isLoading}
                      className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    URL complète de votre profil LinkedIn professionnel
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    Numéro de téléphone <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+33 6 12 34 56 78"
                      type="tel"
                      disabled={isLoading}
                      className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    Votre numéro de téléphone avec l'indicatif pays
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">
                  Mot de passe
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      disabled={isLoading}
                      className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10 rounded-xl"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">
                  Confirmer le mot de passe
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showConfirmPassword ? "text" : "password"}
                      disabled={isLoading}
                      className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10 rounded-xl"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer mon compte
          </Button>
        </form>
      </Form>
    </div>
  );
}
