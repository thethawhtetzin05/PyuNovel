"use client";

import { useState } from "react";
import { Copy, Check, X, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl mt-12 mb-12 overflow-hidden">
            <div className="bg-primary/5 px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc] shadow-inner">
                        <Send size={20} fill="currentColor" className="rotate-[-15deg] ml-[-2px]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-foreground">Telegram Integration</h2>
                        <p className="text-xs text-muted-foreground font-medium">Link your account to publish instantly</p>
                    </div>
                </div>
                {isLinked && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 py-1 px-3">
                        <ShieldCheck size={14} />
                        Connected
                    </Badge>
                )}
            </div>

            <CardContent className="p-6 sm:p-8">
                {isLinked ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                                <Check size={24} strokeWidth={3} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">Account Linked Successfully</p>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    Connected as <span className="text-foreground font-bold">{tgName || "User"}</span>
                                    {tgUsername && <span className="ml-1 opacity-60">(@{tgUsername.replace('@', '')})</span>}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={generateToken}
                                disabled={isLoading}
                                className="rounded-xl h-10 font-bold border-primary/20 hover:bg-primary/5 hover:text-primary transition-all flex-1 sm:flex-none"
                            >
                                <RefreshCw size={14} className={cn("mr-2", isLoading && "animate-spin")} />
                                Re-Link
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={disconnectTelegram}
                                disabled={isLoading}
                                className="rounded-xl h-10 font-bold text-destructive hover:bg-destructive/10 hover:text-destructive flex-1 sm:flex-none"
                            >
                                <X size={14} className="mr-2" />
                                Disconnect
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 text-center sm:text-left">
                        {!token ? (
                            <div className="space-y-6">
                                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                                    Publish your novel chapters directly from Telegram. Send text or files to our bot and we'll handle the rest.
                                </p>
                                <Button
                                    variant="premium"
                                    size="lg"
                                    onClick={generateToken}
                                    disabled={isLoading}
                                    className="w-full sm:w-auto h-12 px-8 shadow-blue-500/20"
                                >
                                    {isLoading ? (
                                        <>
                                            <RefreshCw size={18} className="mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw size={18} className="mr-2" />
                                            Generate Connection Link
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                                        <p className="text-sm text-foreground">
                                            Open our Telegram Bot: <a href="https://t.me/PyuNovel_Bot" target="_blank" className="text-primary font-black hover:underline decoration-2 underline-offset-2">@PyuNovel_Bot</a>
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                                        <p className="text-sm text-foreground">
                                            Copy the code below and send it to the bot.
                                        </p>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                                    <div className="relative flex items-center gap-2 bg-muted/50 p-2 rounded-2xl border border-border/50">
                                        <div className="flex-1 px-4 py-4 font-mono text-xl font-black tracking-[0.2em] text-primary text-center">
                                            {token}
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            onClick={copyToClipboard}
                                            className="h-12 w-12 rounded-xl shrink-0 shadow-sm"
                                        >
                                            {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                    <X size={14} />
                                    <span>Code expires in 5 minutes. Refresh after sending.</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
