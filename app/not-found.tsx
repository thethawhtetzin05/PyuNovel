import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '404 - Page Not Found | PyuNovel',
    description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
            {/* Visual Glitch / Error Number */}
            <h1
                className="text-8xl md:text-9xl font-black mb-4 tracking-tighter"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--foreground)" }}
            >
                <span className="gradient-text">4</span>0<span className="gradient-text">4</span>
            </h1>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
                Lost in the Realms?
            </h2>

            {/* Description */}
            <p className="max-w-md text-lg mb-10" style={{ color: "var(--text-muted)" }}>
                The ancient scroll you are looking for has been destroyed, or perhaps it never existed in this timeline.
            </p>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link
                    href="/"
                    className="btn-primary w-full sm:w-auto h-12 px-8 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    Return Home
                </Link>
                <Link
                    href="/ranking"
                    className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{
                        backgroundColor: "var(--surface-2)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)"
                    }}
                >
                    Discover Novels
                </Link>
            </div>
        </div>
    );
}
