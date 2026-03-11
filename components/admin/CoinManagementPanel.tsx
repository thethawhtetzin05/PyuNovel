'use client';

import { useState } from 'react';
import { adminUpdateUserCoinsAction } from '@/app/[locale]/admin/(dashboard)/coins/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type UserData = {
    id: string;
    name: string;
    email: string;
    coins: number | null;
    image: string | null;
};

export default function CoinManagementPanel({ users }: { users: UserData[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [loadingUser, setLoadingUser] = useState<string | null>(null);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.includes(searchTerm)
    );

    const totalCoinsInCirculation = users.reduce((acc, user) => acc + (user.coins || 0), 0);

    const handleUpdate = async (userId: string, actionType: 'earn' | 'spend') => {
        if (amount <= 0) return alert('Enter a valid amount');
        setLoadingUser(userId);
        try {
            const res = await adminUpdateUserCoinsAction(userId, amount, actionType);
            if (!res.success) alert(res.error);
            else setAmount(0);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoadingUser(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Total Display */}
            <div className="bg-[var(--surface-2)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
                <h3 className="text-sm font-semibold uppercase text-[var(--text-muted)]">Total Coins in Circulation</h3>
                <p className="text-4xl font-black mt-2 text-[var(--foreground)]">🪙 {totalCoinsInCirculation.toLocaleString()}</p>
            </div>

            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <Input
                        placeholder="Search by name, email or ID..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="flex-grow max-w-md"
                    />
                    <Input
                        type="number"
                        placeholder="Amount to grant/deduct"
                        value={amount || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))}
                        className="w-full md:w-48"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                                <th className="pb-3 px-4 font-semibold text-sm">User</th>
                                <th className="pb-3 px-4 font-semibold text-sm">Balance</th>
                                <th className="pb-3 px-4 font-semibold text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]/50 transition-colors">
                                    <td className="py-4 px-4 font-medium text-[var(--foreground)]">
                                        <div className="flex flex-col">
                                            <span>{user.name}</span>
                                            <span className="text-xs text-[var(--text-muted)] font-normal">{user.email}</span>
                                            <span className="text-[10px] text-[var(--text-muted)] opacity-50 font-mono mt-1">{user.id}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-[var(--foreground)] font-bold">
                                        <span className="bg-[var(--surface-2)] px-2 py-1 rounded-md">
                                            🪙 {user.coins || 0}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right space-x-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleUpdate(user.id, 'earn')}
                                            disabled={loadingUser === user.id}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            Top Up (+)
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleUpdate(user.id, 'spend')}
                                            disabled={loadingUser === user.id}
                                        >
                                            Deduct (-)
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-8 text-center text-[var(--text-muted)]">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
