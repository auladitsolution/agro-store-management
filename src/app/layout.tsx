import type { Metadata } from 'next';
import { Hind_Siliguri } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/authContext';
import { Toaster } from 'sonner';

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-hind-siliguri',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'এগ্রো স্টোর ম্যানেজমেন্ট সিস্টেম | Aulad IT Solution',
  description: 'বাংলাদেশি কৃষি ইনপুট ও এগ্রো শপের সম্পূর্ণ বাণিজ্যিক ম্যানেজমেন্ট সফটওয়্যার',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} ${hindSiliguri.className} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${hindSiliguri.className} min-h-full flex flex-col bg-slate-50 text-slate-900`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
