'use client';

import { useState } from 'react';

export default function AdminLoginForm({ locale }: { locale: string }) {
    const [key, setKey] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, locale }),
            });
            const data = await res.json() as { error?: string; redirectTo?: string };
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else if (data.redirectTo) {
                window.location.href = data.redirectTo;
            }
        } catch {
            setError('Connection error. Please try again.');
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
