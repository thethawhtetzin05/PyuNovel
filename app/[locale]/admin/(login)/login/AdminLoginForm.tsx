'use client';

import { useState } from 'react';
import { loginWithAdminKey } from '../../actions';

export default function AdminLoginForm({ locale }: { locale: string }) {
    const [key, setKey] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await loginWithAdminKey(key, locale);
            if (res?.error) {
                setError(res.error);
                setLoading(false);
            }
        } catch (err) {
            // Next.js redirect errors are expected, but other crashes should be caught
            if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
                return; // Let Next.js handle the redirect
            }
            console.error("Login client error:", err);
            setError("Something went wrong. Please check if you have re-deployed your site after adding the secret key.");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[var(--surface)] p-8 rounded-2xl shadow-xl border border-[var(--border)]">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Admin Portal</h1>
                    <p className="text-[var(--text-muted)] mt-2">Enter secret key to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                            Secret Key
                        </label>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            className="w-full bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-[var(--action)] outline-none text-[var(--foreground)] transition"
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm font-medium">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[var(--action)] text-white py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? "Verifying..." : "Access Dashboard"}
                    </button>
                </form>
            </div>
        </div>
    );
}
