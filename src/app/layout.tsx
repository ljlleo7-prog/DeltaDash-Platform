import type { Metadata } from 'next';
import { Orbitron, Rajdhani, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { LanguageProvider } from '@/components/language-provider';

const headingFont = Orbitron({
  subsets: ['latin'],
  variable: '--font-heading-next',
});

const bodyFont = Rajdhani({
  subsets: ['latin'],
  variable: '--font-body-next',
  weight: ['400', '500', '600', '700'],
});

const monoFont = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Delta Dash 平台',
  description: 'Delta Dash 官方发布、下载、创意工坊模组、分支规则、社区讨论与规则浏览平台。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LanguageProvider>
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
