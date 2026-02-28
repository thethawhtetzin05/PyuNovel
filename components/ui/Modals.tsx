"use client";

import React from "react";
import { X, AlertTriangle, Info, CheckCircle2, Loader2 } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDestructive = false,
    isLoading = false,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[var(--surface)] w-full max-w-sm rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${isDestructive ? "bg-red-500/10 text-red-500" : "bg-[var(--action)]/10 text-[var(--action)]"
                        }`}>
                        {isDestructive ? <AlertTriangle size={24} /> : <Info size={24} />}
                    </div>

                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{title}</h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="bg-[var(--surface-2)]/50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3 border-t border-[var(--border)]">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg ${isDestructive
                                ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                                : "bg-[var(--action)] hover:bg-[var(--action-hover)] text-white shadow-[var(--action)]/20"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 h-11 rounded-xl font-bold text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-all active:scale-[0.98] border border-[var(--border)]"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: "info" | "success" | "error";
}

export function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    type = "info",
}: AlertModalProps) {
    if (!isOpen) return null;

    const icons = {
        info: <Info size={24} className="text-blue-500" />,
        success: <CheckCircle2 size={24} className="text-emerald-500" />,
        error: <AlertTriangle size={24} className="text-red-500" />,
    };

    const bgColors = {
        info: "bg-blue-500/10",
        success: "bg-emerald-500/10",
        error: "bg-red-500/10",
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[var(--surface)] w-full max-w-sm rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${bgColors[type]}`}>
                        {icons[type]}
                    </div>

                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{title}</h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="px-6 pb-6 pt-2">
                    <button
                        onClick={onClose}
                        className="w-full h-12 rounded-xl font-bold text-white bg-slate-900 hover:bg-black transition-all active:scale-[0.98] shadow-xl shadow-gray-200 dark:shadow-none"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
