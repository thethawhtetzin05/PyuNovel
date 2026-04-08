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

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [modalActionType, setModalActionType] = useState<'earn' | 'spend'>('earn');
    const [modalAmount, setModalAmount] = useState<number>(100);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.includes(searchTerm)
    );

    const totalCoinsInCirculation = users.reduce((acc, user) => acc + (user.coins || 0), 0);

    const handleOpenModal = (user: UserData, type: 'earn' | 'spend') => {
        if (amount > 0) {
            // If global amount is set, just execute immediately
            handleExecuteUpdate(user.id, type, amount);
        } else {
            setSelectedUser(user);
            setModalActionType(type);
            setModalAmount(100);
            setIsModalOpen(true);
        }
    };

    const handleExecuteUpdate = async (userId: string, type: 'earn' | 'spend', val: number) => {
        setLoadingUser(userId);
        try {
            const res = await adminUpdateUserCoinsAction(userId, val, type);
            if (!res.success) alert(res.error);
            else {
                setAmount(0);
                setIsModalOpen(false);
            }
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
                <div className="mb-8 flex flex-col lg:flex-row gap-6 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2 ml-1">Search User</label>
                        <Input
                            placeholder="Search by name, email or ID..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className="bg-[var(--surface-2)] border-[var(--border)] rounded-xl"
                        />
                    </div>
                    <div className="w-full lg:w-64">
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2 ml-1">Quick Amount</label>
                        <Input
                            type="number"
                            placeholder="e.g. 1000"
                            value={amount || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))}
                            className="bg-[var(--surface-2)] border-[var(--border)] rounded-xl"
                        />
                        <p className="text-[10px] text-[var(--text-muted)] mt-2 italic ml-1">Preset amount for faster updates</p>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                                <th className="pb-4 px-4 font-bold text-xs uppercase tracking-widest">User</th>
                                <th className="pb-4 px-4 font-bold text-xs uppercase tracking-widest">Balance</th>
                                <th className="pb-4 px-4 font-bold text-xs uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b border-[var(--border)] group hover:bg-[var(--surface-2)]/40 transition-colors">
                                    <td className="py-5 px-4 font-medium text-[var(--foreground)]">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{user.name}</span>
                                            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">{user.email}</span>
                                            <span className="text-[9px] text-[var(--text-muted)] opacity-50 font-mono mt-1 tabular-nums">#{user.id}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 text-[var(--foreground)] font-black">
                                        <div className="inline-flex items-center gap-1.5 bg-[var(--surface-2)] px-3 py-1.5 rounded-xl text-amber-600">
                                            <span>🪙</span>
                                            <span>{(user.coins || 0).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleOpenModal(user, 'earn')}
                                                disabled={loadingUser === user.id}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 font-bold shadow-sm shadow-emerald-500/20"
                                            >
                                                Top Up
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleOpenModal(user, 'spend')}
                                                disabled={loadingUser === user.id}
                                                className="rounded-xl px-4 font-bold shadow-sm shadow-red-500/10"
                                            >
                                                Deduct
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-12 text-center text-[var(--text-muted)]">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Custom Modal for Amount Entry */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div 
                        className="bg-[var(--surface)] w-full max-w-sm rounded-[2rem] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8">
                            <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center ${
                                modalActionType === 'earn' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                            }`}>
                                {modalActionType === 'earn' ? <span className="text-3xl">📥</span> : <span className="text-3xl">📤</span>}
                            </div>
                            
                            <h3 className="text-2xl font-black text-[var(--foreground)] leading-tight">
                                {modalActionType === 'earn' ? 'Top Up Coins' : 'Deduct Coins'}
                            </h3>
                            <p className="text-[var(--text-muted)] mt-2 font-medium">
                                For <span className="text-[var(--foreground)] font-bold">{selectedUser.name}</span>
                            </p>

                            <div className="mt-8 space-y-4">
                                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Enter Amount</label>
                                <Input 
                                    type="number"
                                    autoFocus
                                    value={modalAmount || ''}
                                    onChange={(e) => setModalAmount(Number(e.target.value))}
                                    className="text-2xl h-16 font-black text-center bg-[var(--surface-2)] border-none rounded-3xl"
                                    placeholder="0"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    {[100, 500, 1000].map(val => (
                                        <button 
                                            key={val}
                                            onClick={() => setModalAmount(val)}
                                            className="py-2 rounded-xl bg-[var(--surface-2)] text-xs font-bold hover:bg-[var(--action)]/10 hover:text-[var(--action)] transition-all"
                                        >
                                            +{val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-0 flex gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 h-14 rounded-2xl font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleExecuteUpdate(selectedUser.id, modalActionType, modalAmount)}
                                disabled={loadingUser === selectedUser.id || !modalAmount || modalAmount <= 0}
                                className={`flex-1 h-14 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-xl disabled:opacity-50 ${
                                    modalActionType === 'earn' 
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                                        : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                }`}
                            >
                                {loadingUser === selectedUser.id ? 'Updating...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
