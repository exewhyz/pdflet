import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'ResumeForge — PDF Generation Dashboard',
  description: 'Multi-tenant resume PDF generation SaaS dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-[260px] p-8 min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  );
}
