import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";

export const metadata: Metadata = {
  title: "PyuNovel – Read Epic Stories Online",
  description: "A premium novel reading platform. Discover thousands of stories across every genre.",
  keywords: ["novels", "reading", "stories", "fiction", "light novel"],
  metadataBase: new URL("https://pyunovel.com"),
  openGraph: {
    type: "website",
    siteName: "PyuNovel",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" themes={['light', 'dark']}>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t py-8 mt-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <div className="max-w-screen-xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-sm font-semibold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--foreground)" }}>
                  <span className="gradient-text">Pyu</span>Novel
                </span>
                <div className="flex items-center gap-6 text-sm" style={{ color: "var(--text-muted)" }}>
                  <a href="/about" className="hover:text-[var(--foreground)] transition">About</a>
                  <a href="/privacy" className="hover:text-[var(--foreground)] transition">Privacy</a>
                  <a href="/novel/create" className="hover:text-[var(--foreground)] transition">Write</a>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  © {new Date().getFullYear()} PyuNovel
                </p>
              </div>
            </footer>
          </div>
        </ThemeProvider>

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