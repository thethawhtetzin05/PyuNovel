"use client";

import { useState } from "react";
import { Copy, Check, X, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';

interface TelegramConnectFormProps {
    isLinked: boolean;
    initialToken?: string | null;
    tgName?: string | null;
    tgUsername?: string | null;
}

export default function TelegramConnectForm({
    isLinked,
    initialToken,
    tgName,
    tgUsername
}: TelegramConnectFormProps) {
    const t = useTranslations('Navbar');
    const router = useRouter();
    const [token, setToken] = useState<string | null>(initialToken || null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateToken = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${window.location.origin}/api/telegram/generate-token`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json() as { token: string };
                setToken(data.token);
            }
        } catch (error) {
            console.error("Failed to generate token", error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!token) return;
        navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const disconnectTelegram = async () => {
        if (!confirm("Are you sure you want to disconnect your Telegram account?")) return;
        setIsLoading(true);
        try {
            await fetch(`${window.location.origin}/api/telegram/disconnect`, { method: 'POST' });
            router.refresh(); 
            setTimeout(() => window.location.reload(), 300);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="mt-12 mb-12 animate-in fade-in duration-700">
            {/* Header Section - Cleaner, no card container yet */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                        <Send size={24} fill="currentColor" className="rotate-[-15deg] ml-[-2px]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-foreground">{t('telegramIntegration')}</h2>
                        <p className="text-sm text-muted-foreground font-medium">{t('telegramDesc')}</p>
                    </div>
                </div>
                {isLinked && (
                    <Badge variant="secondary" className="w-fit bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 py-1.5 px-4 rounded-full font-bold">
                        <ShieldCheck size={14} />
                        {t('accountLinked')}
                    </Badge>
                )}
            </div>

            {/* Content Section - Minimalist card without heavy borders */}
            <Card className="border-none bg-muted/30 shadow-none rounded-3xl overflow-hidden">
                <CardContent className="p-8 sm:p-10">
                    {isLinked ? (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                    <Check size={32} strokeWidth={3} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg font-black text-foreground">{t('accountLinked')}</p>
                                    <p className="text-muted-foreground mt-1 font-medium">
                                        {t('connectedAs')} <span className="text-foreground font-black underline decoration-primary/30 underline-offset-4">{tgName || "User"}</span>
                                        {tgUsername && <span className="ml-2 opacity-60 font-mono">(@{tgUsername.replace('@', '')})</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={generateToken}
                                    disabled={isLoading}
                                    className="bg-background/50 border-border/50 hover:bg-background rounded-2xl h-12 px-6 font-bold flex-1 md:flex-none"
                                >
                                    <RefreshCw size={16} className={isLoading ? "animate-spin mr-2" : "mr-2"} />
                                    {t('reLink')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={disconnectTelegram}
                                    disabled={isLoading}
                                    className="hover:bg-red-500/10 hover:text-red-500 rounded-2xl h-12 px-6 font-bold flex-1 md:flex-none"
                                >
                                    <X size={16} className="mr-2" />
                                    {t('disconnect')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl">
                            {!token ? (
                                <div className="space-y-8">
                                    <p className="text-base text-muted-foreground leading-relaxed">
                                        {t('telegramDesc')}. Publish novel chapters directly from Telegram by sending text or files to our bot.
                                    </p>
                                    <Button
                                        variant="premium"
                                        size="lg"
                                        onClick={generateToken}
                                        disabled={isLoading}
                                        className="h-14 px-10 rounded-2xl shadow-xl shadow-blue-500/20 text-base"
                                    >
                                        {isLoading ? (
                                            <>
                                                <RefreshCw size={20} className="mr-3 animate-spin" />
                                                {t('generating')}
                                            </>
                                        ) : (
                                            <>
                                                <Send size={20} className="mr-3" />
                                                {t('generateLink')}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="p-6 rounded-2xl bg-background/50 border border-border/50 space-y-3">
                                            <Badge className="bg-primary/10 text-primary border-none font-bold">Step 1</Badge>
                                            <p className="text-sm font-bold leading-relaxed">
                                                {t('openBot')}: <a href="https://t.me/PyuNovel_Bot" target="_blank" className="text-primary hover:underline decoration-2 underline-offset-2">@PyuNovel_Bot</a>
                                            </p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-background/50 border border-border/50 space-y-3">
                                            <Badge className="bg-primary/10 text-primary border-none font-bold">Step 2</Badge>
                                            <p className="text-sm font-bold leading-relaxed">
                                                {t('copyCode')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                                        <div className="relative flex items-center gap-4 bg-background p-3 rounded-[1.5rem] border border-border/50 shadow-inner">
                                            <div className="flex-1 px-6 py-4 font-mono text-2xl font-black tracking-[0.3em] text-primary text-center">
                                                {token}
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                onClick={copyToClipboard}
                                                className="h-14 w-14 rounded-2xl shrink-0 shadow-sm bg-muted hover:bg-primary hover:text-white transition-all"
                                            >
                                                {copied ? <Check size={24} className="animate-in zoom-in duration-300" /> : <Copy size={24} />}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground bg-background/40 p-4 rounded-2xl border border-border/30">
                                        <Info size={18} className="text-primary shrink-0" />
                                        <span>{t('codeExpiry')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
