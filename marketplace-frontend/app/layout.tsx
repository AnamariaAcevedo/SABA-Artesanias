import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SesionProvider from "@/components/auth/SesionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
    <body className="min-h-full flex flex-col">
    <SesionProvider>
      {children}
    </SesionProvider>
    </body>
    </html>
  );
}
