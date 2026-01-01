import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ActiveBabyProvider } from "@/lib/hooks/useActiveBaby";
import { ThemeProvider } from "@/lib/hooks/useTheme";
import { Toaster } from "react-hot-toast";
import { BottomNav } from "@/components/layout/BottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PWARegister } from "@/components/PWARegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Baby Tracker",
  description: "Track your baby's feeding, sleep, diapers, and growth",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Baby Tracker",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FF6B8A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <ActiveBabyProvider>
                <PWARegister />
                {children}
                <BottomNav />
                <Toaster position="top-right" />
              </ActiveBabyProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
