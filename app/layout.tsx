import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Suspense } from "react";
import { poppins, stack_sans_notch, sora } from "./fonts";
import SmoothScroller from "@/components/SmoothScroller";
import MetaPixel from "@/components/MetaPixel";
import "./globals.css";
import { SessionProvider } from "@/context/SessionContext";
import { getEnvVar } from "@/lib/env-utils";
import QueryProvider from "@/app/providers/QueryProvider";
import SocketProvider from "@/app/providers/SocketProvider";
import ErrorBoundary from "@/components/error-boundary";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Talexia.ai - Your AI-Powered Social Media Team",
  description:
    "Talexia.ai turns your photos into high-impact visuals, plans your calendar, and generates strategic captions and hashtags.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans dark", geist.variable)}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>

      <body suppressHydrationWarning 
        className={`${stack_sans_notch.variable} ${poppins.variable} ${sora.variable} ${stack_sans_notch.className} ${poppins.className} min-h-screen antialiased bg-slate-950 px-2 sm:px-0`}
      >
        <Toaster position="top-right" expand={false} richColors />
        <ErrorBoundary>
          <SessionProvider>
            <QueryProvider>
              <SocketProvider>
                <SmoothScroller />
                {children}
                <Analytics />
                <Suspense fallback={null}>
                  <MetaPixel
                    pixelId={getEnvVar("NEXT_PUBLIC_META_PIXEL_ID") ?? ""}
                  />
                </Suspense>
              </SocketProvider>
            </QueryProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
/* this is updated code  */
