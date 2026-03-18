import type { Metadata, Viewport } from "next";
import "../globals.css";
import Navbar from "@/components/ui/Navbar";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ModalProvider } from "@/components/providers/modal-provider"; // 👈 Provider အသစ်
import Script from "next/script";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Footer from "@/components/ui/Footer";
import BottomNav from "@/components/ui/BottomNav";
export const metadata: Metadata = {
  title: "PyuNovel – Read Epic Stories Online",
  description: "A premium novel reading platform. Discover thousands of stories across every genre.",
  keywords: ["novels", "reading", "stories", "fiction", "light novel"],
  metadataBase: new URL("https://pyunovel.pages.dev"),
  openGraph: {
    type: "website",
    siteName: "PyuNovel",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!['en', 'my'].includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider attribute="class" defaultTheme="light" themes={['light', 'dark']}>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <ModalProvider /> {/* 👈 ModalUI နေရာ */}
              <main className="flex-1 pb-16 md:pb-0">
                {children}
              </main>

              <Footer />
              <BottomNav />
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>

        {/* Cloudflare Web Analytics */}
        {process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN && (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN}"}`}
          />
        )}
      </body>
    </html>
  );
}