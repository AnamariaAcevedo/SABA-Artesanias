import type { Metadata } from "next";
import { DM_Sans, Fraunces, Geist_Mono } from "next/font/google";
import "./globals.css";
import SesionProvider from "@/components/auth/SesionProvider";
import DialogosHost from "@/components/dialogos/Dialogos";

// Tipografía del sistema: Fraunces (serif con trazo artesanal) para títulos y
// marca; DM Sans (sans sobria) para la interfaz y los textos de lectura.
const fuenteSerif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["opsz"],
});

const fuenteSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SABA Artesanías",
  description: "Artesanías con historia. Conectá con nuestros artesanos en SABA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fuenteSerif.variable} ${fuenteSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
    <body className="min-h-full flex flex-col" suppressHydrationWarning>
    <SesionProvider>
      {children}
    </SesionProvider>
    <DialogosHost />
    </body>
    </html>
  );
}
