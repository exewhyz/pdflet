import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
import { SidebarProvider } from '@/components/SidebarContext';
import { MobileHeader } from '@/components/MobileHeader';
import './globals.css';

export const metadata: Metadata = {
  title: 'ResumeForge — PDF Generation Dashboard',
  description: 'Multi-tenant resume PDF generation SaaS dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <MobileHeader />
            <main className="flex-1 lg:ml-[260px] pt-[72px] lg:pt-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 min-h-screen w-full">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
