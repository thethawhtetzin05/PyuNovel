"use client";
import { Link } from "@/i18n/routing";
import ThemeSwitcher from './theme-switcher';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslations } from 'next-intl';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const t = useTranslations('Navbar');
  const links = [
    { href: "/writer", label: t('create'), icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
    { href: "/integration", label: t('integration'), icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
    { href: "/manual", label: t('userManual'), icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" },
  ];
  return (
    <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${isOpen ? "" : "pointer-events-none"}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute left-0 top-0 h-full w-72 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            <span className="text-primary drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">Pyu</span>
            <span style={{ color: "var(--foreground)" }}>Novel</span>
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition hover:bg-[var(--surface-2)]"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-[var(--surface-2)]"
              style={{ color: "var(--foreground)" }}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
              </svg>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}