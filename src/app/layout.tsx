import type { Metadata } from "next";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RootClientLayout } from "@/components/layout/RootClientLayout";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "MiroAI",
  description: "Minimal AI workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F6F7FB] font-sans text-slate-900 antialiased">
        <FirebaseClientProvider>
          <AuthGuard>
            <RootClientLayout>{children}</RootClientLayout>
          </AuthGuard>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
