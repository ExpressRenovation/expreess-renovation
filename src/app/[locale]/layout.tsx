import type { Metadata } from 'next';
import { ThemeProvider } from "next-themes";
import '../globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { BudgetWidgetProvider } from '@/context/budget-widget-context';
import i18nConfig from '../../../i18nConfig';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/dictionaries';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { SmartBudgetTrigger } from '@/components/budget-widget/smart-trigger';
import { SmartBudgetModal } from '@/components/budget-widget/budget-modal';
import localFont from 'next/font/local';

const dastin = localFont({
  src: [
    {
      path: '../../../public/fonts/Dastin.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/Dastin.woff',
      weight: '400', // Woff fallback
      style: 'normal',
    },
  ],
  variable: '--font-headline',
  display: 'swap',
});

const siteConfig = {
  name: 'Nombre de empresa',
  description: 'Soluciones expertas de construcción, reformas, piscinas y más. Calidad y confianza para tu hogar o negocio.',
  url: 'https://example.com', // Replace with your actual domain
  ogImage: '', // Replace with your actual OG image URL
};

import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { constructMetadata } from '@/i18n/seo-utils';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  /* 
    MetadataBase is critical for resolving relative URLs in OG images and alternates.
    We define it here once. derived metadata in children will use this base.
  */

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://expressrenovationmallorca.com'),
    ...constructMetadata({
      title: t('title'),
      description: t('description'),
      path: '/',
      locale,
      image: '/images/og-home.jpg' // You might want to specific specific home OG image
    }),
    keywords: t('keywords'),
  };
}

export function generateStaticParams() {
  return i18nConfig.locales.map(locale => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;

  if (!i18nConfig.locales.includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const dict = await getDictionary(locale as any);
  const faviconUrl = ""; // Replace with your favicon URL

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} sizes="any" />}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased min-h-screen bg-background flex flex-col', dastin.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="theme-luxury"
          enableSystem={false}
          themes={['theme-blue', 'dark-theme-blue', 'theme-green', 'dark-theme-green', 'theme-orange', 'dark-theme-orange', 'theme-purple', 'dark-theme-purple', 'theme-luxury', 'dark-theme-luxury']}
        >
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <BudgetWidgetProvider>
                {children}
                <SmartBudgetTrigger dictionary={dict?.budgetRequest} />
                <SmartBudgetModal dictionary={dict?.budgetRequest} />
                <Toaster />
              </BudgetWidgetProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
