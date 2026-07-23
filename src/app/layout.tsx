import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { APP_NAME, BRAND_COLOR, INSTITUCION_NOMBRE } from "@/core/lib/branding";
import { Toaster } from "@/core/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: `Sistema de gestión — ${INSTITUCION_NOMBRE}.`,
  applicationName: APP_NAME,
};

export const viewport: Viewport = {
  themeColor: BRAND_COLOR,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
        {/* Toaster global: las páginas NO montan el suyo (a diferencia del
            proyecto origen, acá está centralizado). */}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
