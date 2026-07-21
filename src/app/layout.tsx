import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MicroApps - Nepal Tax Calculator",
  description: "Tax calculation tools for Nepal - Income Tax, SSF, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TooltipProvider>
          <div className="flex h-screen">
            {/* Desktop Sidebar */}
            <Sidebar className="hidden md:flex" />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Mobile Header */}
              <header className="flex h-14 items-center gap-4 border-b px-4 md:hidden">
                <MobileDrawer />
                <span className="font-semibold">MicroApps</span>
              </header>

              {/* Page Content */}
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
