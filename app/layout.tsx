import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Forum Finance - Discussions sur les entretiens en finance",
  description:
    "Plateforme de discussion dédiée aux entretiens en finance, aux stages et aux conseils entre étudiants et professionnels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
