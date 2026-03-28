'use client';

import { useState, useTransition } from 'react';
import { Calendar, Clock, X, Check, Loader2, AlertCircle, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

interface Chapter {
    id: number;
    title: string;
    status: string;
}

interface ScheduleBatchModalProps {
    chapters: Chapter[];
    novelSlug: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ScheduleBatchModal({ chapters, novelSlug, onClose, onSuccess }: ScheduleBatchModalProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>(
        chapters.filter(c => c.status === 'draft' || c.status === 'scheduled').map(c => c.id)
    );
    const [scheduledHour, setScheduledHour] = useState(18);
    const [chaptersPerDay, setChaptersPerDay] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const toggleChapter = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSchedule = () => {
        if (selectedIds.length === 0) {
            setError("ကျေးဇူးပြု၍ အခန်း အနည်းဆုံး တစ်ခု ရွေးချယ်ပေးပါ");
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetch('/api/novel/chapter/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chapterIds: selectedIds,
                        scheduledHour,
                        chaptersPerDay,
                        novelSlug
                    })
                });

                const data = await res.json();
                if (data.success) {
                    onSuccess();
                    onClose();
                } else {
                    setError(data.error || "Schedule လုပ်ရာတွင် အမှားတစ်ခု ရှိနေပါသည်");
                }
            } catch (err) {
                setError("Network error: ဆာဗာနှင့် ချိတ်ဆက်၍ မရပါ");
            }
        });
    };

    // Calculate preview dates
    const previewDates = selectedIds.map((_, i) => {
        const now = new Date();
        const baseDate = new Date(now);
        baseDate.setHours(scheduledHour, 0, 0, 0);
        if (baseDate <= now) baseDate.setDate(baseDate.getDate() + 1);

        const intervalHours = 24 / chaptersPerDay;
        return new Date(baseDate.getTime() + (i * intervalHours) * 60 * 60 * 1000);
    });

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-border bg-background shadow-2xl">
                <DialogHeader className="p-8 pb-4 bg-primary/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Clock size={20} />
                        </div>
                        <DialogTitle className="text-2xl font-black">Schedule Posts</DialogTitle>
                    </div>
                    <DialogDescription className="font-medium text-muted-foreground">
                        ရွေးချယ်ထားသော အခန်းများကို သတ်မှတ်ထားသော အချိန်ဇယားအတိုင်း အလိုအလျောက် တင်သွားပါမည်။
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 pt-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">တင်မည့် အချိန် (နာရီ)</label>
                            <Select value={scheduledHour.toString()} onValueChange={(v) => setScheduledHour(parseInt(v))}>
                                <SelectTrigger className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-black text-lg">
                                    <SelectValue placeholder="Select Hour" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border bg-background shadow-xl max-h-60">
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <SelectItem key={i} value={i.toString()} className="font-bold">
                                            {i.toString().padStart(2, '0')}:00
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">တစ်နေ့လျှင် တင်မည့် အခန်းအရေအတွက်</label>
                            <Input
                                type="number"
                                min={1}
                                value={chaptersPerDay}
                                onChange={(e) => setChaptersPerDay(Number(e.target.value))}
                                className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-black text-lg"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl">
                            <label className="text-sm font-black uppercase tracking-wider text-muted-foreground">Select Chapters ({selectedIds.length})</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedIds(selectedIds.length === chapters.length ? [] : chapters.map(c => c.id))}
                                className="text-xs font-bold hover:text-primary transition-colors h-8"
                            >
                                {selectedIds.length === chapters.length ? 'Unselect All' : 'Select All'}
                            </Button>
                        </div>

                        <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden max-h-60 overflow-y-auto bg-card">
                            {chapters.length > 0 ? chapters.map((chapter, i) => (
                                <div
                                    key={chapter.id}
                                    className={`flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer ${selectedIds.includes(chapter.id) ? 'bg-primary/5' : ''}`}
                                    onClick={() => toggleChapter(chapter.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(chapter.id)}
                                        readOnly
                                        className="h-4 w-4 rounded border-primary/20 accent-primary"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{chapter.title}</p>
                                        {selectedIds.includes(chapter.id) && (
                                            <p className="text-[10px] font-bold text-primary flex items-center gap-1 mt-0.5">
                                                <Clock size={10} />
                                                Will post on {previewDates[selectedIds.indexOf(chapter.id)].toLocaleString('my-MM', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold capitalize">
                                        {chapter.status}
                                    </Badge>
                                </div>
                            )) : (
                                <p className="p-10 text-center text-sm font-medium text-muted-foreground">No chapters available to schedule.</p>
                            )}
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3 text-sm text-blue-600 font-medium">
                        <Info size={18} className="shrink-0 mt-0.5" />
                        <p>တင်ပြီးသား (Published) အခန်းများကို ထပ်မံ Schedule လုပ်ပါက သတ်မှတ်ထားသော အချိန်ရောက်မှ ပြန်ပေါ်လာမည် ဖြစ်ပါသည်။</p>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-4 border-t border-border bg-muted/5">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-xl font-bold h-12 px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSchedule}
                        disabled={selectedIds.length === 0 || isPending}
                        className="rounded-xl font-black bg-[var(--action)] hover:bg-[var(--action)]/90 h-12 px-10 shadow-xl shadow-[var(--action)]/20 gap-2 min-w-[160px]"
                    >
                        {isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        {isPending ? 'Scheduling...' : 'Confirm Schedule'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
