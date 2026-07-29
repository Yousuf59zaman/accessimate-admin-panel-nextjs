import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "primeicons/primeicons.css";
import { AdminAuthProvider } from "@/app/contexts/AdminAuthContext";
import { CitizenAuthProvider } from "@/app/contexts/CitizenAuthContext";
import { SidebarProvider } from "@/app/contexts/SidebarContext";
import { ThemeProvider } from "next-themes";
import PrimeReactSetup from "@/app/primereact-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Accessimate Control | Full-Stack Multi-Panel SaaS",
    template: "%s | Accessimate Control",
  },
  description:
    "Independent Next.js, NestJS, Prisma, and PostgreSQL multi-panel SaaS with secure reviewer access, persisted CMS workflows, and live analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
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
