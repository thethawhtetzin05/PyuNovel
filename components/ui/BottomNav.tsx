"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Home, Library, BookHeart, CircleUser } from "lucide-react";
import Image from "next/image";

export default function BottomNav() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const isActive = (path: string) => {
        return pathname === `/en${path}` || pathname === `/my${path}` || (path === '/' && (pathname === '/en' || pathname === '/my'));
    };

    const navItems = [
        {
            icon: <Home className="w-7 h-7 text-current transition-colors" strokeWidth={1.5} />,
            href: '/',
        },
        {
            icon: <Library className="w-7 h-7 text-current transition-colors" strokeWidth={1.5} />,
            href: '/ranking',
        },
        {
            icon: <BookHeart className="w-7 h-7 text-current transition-colors" strokeWidth={1.5} />,
            href: '/collection',
        },
        {
            // If logged in, show user image inside a ring; else show user icon
            icon: session?.user ? (
                <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800 shrink-0">
                    {session.user.image ? (
                        <Image src={session.user.image} alt="Profile" width={28} height={28} className="object-cover w-full h-full" />
                    ) : (
                        <div className="w-full h-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                            {session.user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                    )}
                </div>
            ) : (
                <CircleUser className="w-7 h-7 text-current transition-colors" strokeWidth={1.5} />
            ),
            href: session?.user ? '/profile' : '/sign-in',
        },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#09090b] border-t border-gray-200 dark:border-gray-800 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between h-[60px] px-2 sm:px-6">
                {navItems.map((item, idx) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={idx}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center w-[25%] h-full group pb-1"
                        >
                            <div
                                className={`flex flex-col items-center justify-center w-full py-2 rounded-2xl transition-all duration-300 ease-in-out ${active
                                    ? "text-blue-600 dark:text-blue-400 -translate-y-1"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    }`}
                            >
                                {/* Active Indicator Glow Background */}
                                {active && (
                                    <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-900/30 rounded-2xl -z-10 animate-fade-in" />
                                )}

                                <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-active:scale-95'}`}>
                                    {item.icon}
                                </div>

                                {/* Bottom Active Little Dot */}
                                {active && (
                                    <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-fade-in" />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
