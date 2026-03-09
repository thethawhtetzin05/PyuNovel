"use client";
import { Link } from "@/i18n/routing";
import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import ThemeSwitcher from "./theme-switcher";
import LanguageSwitcher from "./LanguageSwitcher";
import ReportModal from "@/components/modals/ReportModal";
import SearchModal from "@/components/modals/SearchModal";
import { useTranslations } from 'next-intl';
import Image from "next/image";

export default function Navbar() {
  const t = useTranslations('Navbar');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsProfileOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsProfileOpen(false);
    }, 300); // 300ms delay before it disappears
  };

  const { data: session, isPending } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
        setIsProfileOpen(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (pathname?.includes('/admin')) return null;

  return (
    <>
      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ease-in-out
          ${isVisible ? "translate-y-0" : "-translate-y-full"}
          ${isScrolled
            ? "bg-[var(--surface)]/80 backdrop-blur-xl shadow-sm border-b border-border/10"
            : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-[60px] items-center gap-4">

            {/* Left */}
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition md:hidden"
                aria-label="Open menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 shrink-0 group">
                <span
                  className="text-2xl font-black tracking-tighter transition-all group-hover:scale-105 active:scale-95"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  <span className="text-primary drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">Pyu</span>
                  <span className="text-foreground">Novel</span>
                </span>
              </Link>

              {/* Desktop nav links */}
              <div className="hidden md:flex items-center gap-1 ml-4">
                {[
                  { href: "/", label: t('home') },
                  { href: "/ranking", label: t('ranking') },
                  { href: "/collection", label: t('collection') },
                  { href: "/writer", label: t('create') },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 text-lg font-semibold rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
                aria-label="Search"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Switches */}
              <div className="hidden md:flex items-center gap-2">
                <ThemeSwitcher />
              </div>

              {/* Auth */}
              {isPending ? (
                <div className="h-8 w-8 bg-[var(--surface-2)] rounded-full animate-pulse" />
              ) : session ? (
                <div
                  className="relative"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-[var(--border)] hover:ring-[var(--accent)] transition-all overflow-hidden"
                    style={{ background: "var(--gradient-primary)" }}
                    aria-label="User menu"
                  >
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name ?? "User"}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      session.user.name?.charAt(0).toUpperCase() || "U"
                    )}
                  </button>

                  {/* Dropdown */}
                  {isProfileOpen && (
                    <div className="animate-fade-in absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl overflow-hidden z-50 border border-[var(--border)]" style={{ background: "var(--surface)" }}>
                      <div className="px-4 py-3 border-b border-[var(--border)]" style={{ background: "var(--surface-2)" }}>
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{session.user.name}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{session.user.email}</p>
                      </div>
                      <div className="p-1">
                        <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[var(--surface-2)] transition" style={{ color: "var(--foreground)" }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                          {t('profile')}
                        </Link>
                        <button
                          onClick={() => {
                            setIsReportOpen(true);
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[var(--surface-2)] transition text-[var(--foreground)]"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                          {t('reportIssue')}
                        </button>
                        <div className="border-t border-[var(--border)] my-1" />
                        <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                          {t('signOut')}
                        </button>
                        <div className="border-t border-[var(--border)] my-1" />
                        <div className="w-full flex items-center justify-center px-3 py-2">
                          <LanguageSwitcher />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="btn-primary px-5 py-2 text-sm"
                >
                  {t('signIn')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}