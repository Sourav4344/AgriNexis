import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { DemoProvider } from "@/lib/context/DemoContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
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
            <DemoBanner />
            <AppHeader />
            <div className="flex-1 flex min-h-[calc(100vh-105px)]">
              <AppSidebar />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
                {children}
              </main>
            </div>
          </DemoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
