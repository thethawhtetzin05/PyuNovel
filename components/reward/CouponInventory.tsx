"use client";

import { useEffect, useState, useCallback } from "react";

interface Coupon {
    id: number;
    userId: string;
    expiresAt: string | Date;
    usedAt: string | Date | null;
}

export default function CouponInventory() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCoupons = useCallback(async () => {
        try {
            const res = await fetch("/api/reward/coupons");
            const data = await res.json() as { success: boolean; coupons: Coupon[] };
            if (data.success) {
                setCoupons(data.coupons);
            }
        } catch (error) {
            console.error("Failed to fetch coupons:", error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchCoupons();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const now = new Date();
    const validCoupons = coupons.filter(c => !c.usedAt && new Date(c.expiresAt) > now);

    return (
        <div className="bg-[var(--surface-2)] p-6 rounded-2xl border border-[var(--border)] shadow-md mt-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-[var(--foreground)] flex items-center gap-2">
                    🎒 My Inventory
                </h3>
                <span className="bg-emerald-100/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    {validCoupons.length} Active
                </span>
            </div>

            {loading ? (
                <p className="text-[var(--text-muted)] text-center py-4 font-medium">Loading inventory... 🎒</p>
            ) : validCoupons.length === 0 ? (
                <div className="text-center py-8 bg-[var(--surface-3)] rounded-xl border border-dashed border-[var(--border)]">
                    <span className="text-4xl mb-3 block opacity-50 grayscale">🎫</span>
                    <p className="text-[var(--text-muted)] font-medium">You don&apos;t have any active coupons yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {validCoupons.map((c, i) => (
                        <div key={i} className="flex flex-col bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-4 rounded-xl border border-[var(--action)]/30 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-[var(--action)]/60 transition-all hover:-translate-y-0.5 group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-2xl drop-shadow-sm group-hover:scale-110 transition-transform">🎫</span>
                                <span className="text-[10px] bg-[var(--action)] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">Free Chapter</span>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] font-medium">
                                Expires: <span className="font-bold text-[var(--foreground)]">{new Date(c.expiresAt).toLocaleDateString()}</span>
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
