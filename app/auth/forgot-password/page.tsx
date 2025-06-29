import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié - DERIVATIVES",
  description: "Réinitialisez votre mot de passe",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex p-6">
      {/* Left side - Gradient background with text */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-900 relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-black/30"></div>
        {/* Decorative waves */}
        <div className="absolute inset-0 opacity-30">
          <svg
            className="absolute bottom-0 left-0 right-0"
            viewBox="0 0 1440 320"
            fill="none"
          >
            <path
              fill="rgba(255,255,255,0.1)"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-end pb-16 p-12 text-white">
          <div className="mb-8">
            <p className="text-sm font-medium tracking-wider opacity-80 mb-8">
              RÉCUPÉRATION
            </p>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Pas De
              <br />
              Souci,
              <br />
              Ça Arrive
            </h1>
            <p className="text-lg opacity-90 leading-relaxed max-w-md">
              Entrez votre adresse email et nous vous enverrons un lien pour
              réinitialiser votre mot de passe en toute sécurité.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Forgot password form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="DERIVATIVES Logo"
              width={80}
              height={24}
              className="h-6 w-auto"
            />
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Mot de passe oublié
            </h2>
            <p className="text-gray-600">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          <ForgotPasswordForm />

          <div className="text-center space-y-4">
            <Link
              href="/auth/login"
              className="block font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
