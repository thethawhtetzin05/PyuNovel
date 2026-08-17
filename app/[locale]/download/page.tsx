import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Download,
  ShieldCheck,
  Zap,
  Moon,
  WifiOff,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Bell,
  RefreshCw,
  Sliders,
  Bookmark
} from 'lucide-react';

export const metadata = {
  title: 'Download PyuNovel App | Official Android APK',
  description: 'Download the official PyuNovel Mobile App for Android. Read web novels offline with custom reader themes, font settings, and auto updates.',
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12 md:space-y-16 relative">
        
        {/* Background Ambient Glows */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-primary/15 blur-[140px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-96 right-10 w-80 h-80 bg-accent/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* ─── Hero Section ────────────────────────────────────────── */}
        <div className="relative bg-card/80 border border-border/80 rounded-[2.5rem] p-8 sm:p-12 md:p-14 backdrop-blur-xl shadow-sm overflow-hidden">
          {/* Subtle Inner Accent Gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-transparent to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Official Mobile App</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15] text-foreground">
                Read Your Favorite <br className="hidden sm:inline" />
                <span className="text-primary drop-shadow-[0_0_25px_rgba(59,130,246,0.25)]">
                  Novels Anywhere
                </span>
              </h1>

              <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Experience fast, fluid novel reading on Android with offline downloads, custom fonts, dark & sepia themes, coin chapter unlocks, and automatic updates.
              </p>

              {/* Download Action Area */}
              <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <a
                  href="/downloads/pyunovel.apk"
                  download="PyuNovel.apk"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-base"
                >
                  <Download className="w-5 h-5 animate-bounce" />
                  <span>Download APK</span>
                </a>

                <div className="text-xs text-muted-foreground text-center sm:text-left">
                  <span className="font-semibold text-foreground">v1.0.0</span> • Direct APK • Free & Safe
                </div>
              </div>

              {/* Key Features Badges */}
              <div className="pt-6 border-t border-border/70 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <WifiOff className="w-4 h-4 text-primary shrink-0" />
                  <span>Offline Storage</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Moon className="w-4 h-4 text-primary shrink-0" />
                  <span>Dark & Sepia Mode</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <RefreshCw className="w-4 h-4 text-primary shrink-0" />
                  <span>Auto OTA Updates</span>
                </div>
              </div>
            </div>

            {/* Right Phone Mockup Visual */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-72 sm:w-80 bg-gradient-to-b from-card to-muted/40 border-4 border-border rounded-[3rem] shadow-2xl p-4 flex flex-col justify-between items-center text-center overflow-hidden">
                
                {/* Speaker Notch */}
                <div className="w-28 h-4 bg-muted rounded-full mb-3 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-background/50 border border-border" />
                </div>
                
                {/* Screen Content Mockup */}
                <div className="w-full bg-background rounded-[2rem] border border-border/60 p-5 space-y-4 shadow-inner">
                  
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-border/50 pb-3">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/logo.png"
                        alt="PyuNovel"
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-md object-contain"
                      />
                      <span className="font-black text-sm tracking-tight text-foreground">
                        <span className="text-primary">Pyu</span>Novel
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Mobile
                    </span>
                  </div>

                  {/* App Reading Mockup Card */}
                  <div className="bg-muted/40 border border-border/50 rounded-2xl p-4 text-left space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wide">Chapter 42</span>
                      <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <h4 className="font-bold text-xs text-foreground line-clamp-1">The Journey of the Rising Phoenix</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                      The morning mist gently rolled over the mountain peaks as the traveler took the first step into the ancient ruins...
                    </p>
                  </div>

                  {/* Quick Reader Controls Mockup */}
                  <div className="flex items-center justify-between px-2 text-muted-foreground text-[11px]">
                    <span className="flex items-center gap-1"><Sliders className="w-3 h-3 text-primary" /> Font: A+</span>
                    <span className="flex items-center gap-1"><Moon className="w-3 h-3 text-primary" /> Dark</span>
                    <span className="flex items-center gap-1"><WifiOff className="w-3 h-3 text-primary" /> Offline</span>
                  </div>

                </div>

                {/* Bottom Verified Badge */}
                <div className="w-full mt-4 bg-primary/10 border border-primary/20 rounded-2xl py-2 px-3 text-xs text-primary font-semibold flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Safe & Virus-Free</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Key Features Section ─────────────────────────────────── */}
        <div className="space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Why Read on the Mobile App?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Tailored specifically for an immersive, distraction-free reading experience on Android.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 space-y-3 hover:border-primary/40 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Offline Reading</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Save full novels and chapters to your device. Enjoy seamless reading even on flights or when internet is unavailable.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 space-y-3 hover:border-primary/40 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Moon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Custom Reader Themes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Switch effortlessly between Dark, Light, and Sepia modes with adjustable font sizes, line spacing, and Myanmar fonts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 space-y-3 hover:border-primary/40 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Cloud Sync & Coins</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Seamlessly sync your reading history, library bookmarks, and coin wallet between website and mobile app in real-time.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 space-y-3 hover:border-primary/40 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Instant Chapter Alerts</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Never miss a release. Receive instant notifications as soon as your followed authors publish new chapters.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 space-y-3 hover:border-primary/40 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Lightweight & Battery Saver</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Super compact APK size with ultra-smooth scrolling, low RAM usage, and optimized battery consumption.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 space-y-3 hover:border-primary/40 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Auto In-App Updates</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get new features and bug fixes automatically over-the-air without having to manually download APKs every time.
              </p>
            </div>

          </div>
        </div>

        {/* ─── Installation Guide ──────────────────────────────────── */}
        <div className="bg-card border border-border/80 rounded-[2.5rem] p-6 sm:p-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-primary" />
                How to Install on Android
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Follow these simple steps to install the PyuNovel APK on your phone.
              </p>
            </div>
            <span className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border">
              Android 6.0 or higher
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-muted/30 border border-border/50 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary font-black text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-foreground text-base">Download APK</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Tap the <strong>Download APK</strong> button above to save the <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-primary">PyuNovel.apk</code> file to your device.
              </p>
            </div>

            <div className="bg-muted/30 border border-border/50 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary font-black text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-foreground text-base">Allow Installation</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                If prompted by Android security, enable <em>"Allow from this source"</em> or <em>"Install unknown apps"</em> in your phone settings.
              </p>
            </div>

            <div className="bg-muted/30 border border-border/50 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary font-black text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-foreground text-base">Open & Enjoy</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Launch PyuNovel, sign in to sync your coin balance and reading progress, and enjoy offline reading!
              </p>
            </div>

          </div>
        </div>

        {/* ─── Bottom CTA Banner ───────────────────────────────────── */}
        <div className="relative bg-gradient-to-r from-primary/15 via-primary/5 to-accent/15 border border-primary/20 rounded-[2.5rem] p-8 sm:p-12 text-center space-y-6 overflow-hidden">
          <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Ready to dive into great stories?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Get the app now for free and take your entire novel library wherever you go.
          </p>
          <div>
            <a
              href="/downloads/pyunovel.apk"
              download="PyuNovel.apk"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-base"
            >
              <Download className="w-5 h-5" />
              <span>Download PyuNovel APK</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
