"use client";
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const toggleLanguage = () => {
        const nextLocale = locale === 'en' ? 'my' : 'en';
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <div className="flex bg-[var(--surface-2)] border border-[var(--border)] rounded-full p-1 relative w-full max-w-[200px] shadow-inner isolation-auto">
            <button
                onClick={() => locale !== 'en' && startTransition(() => router.replace(pathname, { locale: 'en' }))}
                disabled={isPending}
                className={`relative z-10 px-4 py-1.5 text-sm font-bold rounded-full transition-all duration-300 flex-1 ${locale === 'en' ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                    }`}
            >
                Eng
            </button>
            <button
                onClick={() => locale !== 'my' && startTransition(() => router.replace(pathname, { locale: 'my' }))}
                disabled={isPending}
                className={`relative z-10 px-4 py-1.5 text-sm font-bold rounded-full transition-all duration-300 flex-1 ${locale === 'my' ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                    }`}
                style={{ fontFamily: "'Pyidaungsu', 'Myanmar Text', sans-serif" }}
            >
                မြန်မာ
            </button>

            {/* Sliding Background */}
            <div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-500 shadow-md"
                style={{
                    transform: locale === 'en' ? 'translateX(0)' : 'translateX(100%)',
                    left: '4px',
                    background: "#0066ff", // Using the primary blue from Sign In button
                    transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" // Bouncy spring effect
                }}
            />
        </div>
    );
}
