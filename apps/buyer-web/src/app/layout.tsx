import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { DemoProvider } from "@/lib/context/DemoContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { BuyerExperienceBoundary } from "@/components/layout/BuyerExperienceBoundary";
import { DemoBanner } from "@/components/layout/DemoBanner";

export const metadata: Metadata = {
  title: "AgriNexis | Buyer & FPO Dashboard",
  description: "Transparent Direct Agriculture Procurement & Fulfillment Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen flex flex-col font-sans antialiased text-slate-900">
        <AuthProvider>
          <DemoProvider>
            <a href="#main-content" className="skip-link">Skip to content</a>
            <DemoBanner />
            <BuyerExperienceBoundary>
            <AppHeader />
            <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-105px)]">
              <AppSidebar />
              <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
                {children}
              </main>
            </div>
            </BuyerExperienceBoundary>
          </DemoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
