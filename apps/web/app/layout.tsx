import type { Metadata } from "next";
import { Roboto, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/session-provider";
import { Header } from "@/components/header";
import { QueryProvider } from "@/components/query-provider";
import { SentryInit } from "@/components/sentry-init";
import { SpeedInsights } from "@vercel/speed-insights/next";

const roboto = Roboto({
  weight: ["100", "300", "400", "500"],
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diário",
  description: "Sistema de notas e presenças",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${roboto.variable} ${jetbrainsMono.variable} h-full antialiased tabular-nums`}
    >
      <body className="min-h-full flex flex-col">
        <SentryInit />
        <AuthSessionProvider>
          <QueryProvider>
            <Header />
            <main className="flex-1 w-full mx-auto max-w-full sm:max-w-6xl px-3 sm:px-6">{children}</main>
          </QueryProvider>
        </AuthSessionProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
