import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "primeicons/primeicons.css";
import { AdminAuthProvider } from "@/app/contexts/AdminAuthContext";
import { CitizenAuthProvider } from "@/app/contexts/CitizenAuthContext";
import { SidebarProvider } from "@/app/contexts/SidebarContext";
import { ThemeProvider } from "next-themes";
import PrimeReactSetup from "@/app/primereact-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Accessimate Admin",
  description: "Accessimate Admin Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/fa-6.4.0/css/all.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <PrimeReactSetup>
            <AdminAuthProvider>
              <CitizenAuthProvider>
                <SidebarProvider>{children}</SidebarProvider>
              </CitizenAuthProvider>
            </AdminAuthProvider>
          </PrimeReactSetup>
        </ThemeProvider>
      </body>
    </html>
  );
}
