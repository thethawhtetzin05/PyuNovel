'use client';

import { useState, useRef, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    Settings,
    Eye,
    Bookmark,
    Plus,
    Pencil,
    Trash2,
    ArrowUpDown,
    Shield,
    TrendingUp,
    Clock,
    Upload,
    Save,
    Loader2,
    AlertTriangle,
    Crown
} from "lucide-react";
import BulkUploadModal from '@/app/[locale]/novel/[slug]/bulk-upload-modal';
import { Link } from '@/i18n/routing';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertModal, ConfirmModal } from '@/components/ui/Modals';

interface Novel {
    id: number;
    slug: string;
    title: string;
    author: string;
    description: string | null;
    coverUrl: string | null;
    status: string | null;
    views: number;
    tags: string;
    chapterPrice: number;
    isScheduledMode: boolean;
    chaptersPerDay: number;
    scheduledHour: number;
}

interface Chapter {
    id: number;
    title: string;
    sortIndex: number;
    isPaid: boolean | null;
    status: string;
    publishedAt: Date | null;
    createdAt: Date | null;
    volumeId?: number | null;
}

interface Volume {
    id: number;
    name: string;
    sortIndex: number;
}

interface Props {
    novel: Novel;
    chapters: Chapter[];
    volumes: Volume[];
    collectorCount: number;
    locale: string;
    translations: Record<string, string>;
}

export default function NovelManagementClient({
    novel,
    chapters,
    volumes,
    collectorCount,
    locale,
    translations
}: Props) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSaving, setIsSaving] = useState(false);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
    const [openSetting, setOpenSetting] = useState<string | null>(null);
    const [showWheel, setShowWheel] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const hourWheelRef = useRef<HTMLDivElement>(null);
    const periodWheelRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState({
        title: novel.title,
        author: novel.author,
        description: novel.description || '',
        tags: novel.tags,
        status: novel.status || 'ongoing',
        chapterPrice: novel.chapterPrice || 0,
        paidFrom: chapters.some(c => c.isPaid) ? Math.min(...chapters.filter(c => c.isPaid).map(c => c.sortIndex)) : 0,
        paidTo: chapters.some(c => c.isPaid) ? Math.max(...chapters.filter(c => c.isPaid).map(c => c.sortIndex)) : 0,
        isScheduledMode: novel.isScheduledMode || false,
        scheduledHour: novel.scheduledHour || 18,
        chaptersPerDay: novel.chaptersPerDay || 1
    });

    // Sync wheels on open
    useLayoutEffect(() => {
        if (showWheel) {
            const h12 = form.scheduledHour % 12 || 12;
            const periodIdx = form.scheduledHour < 12 ? 0 : 1;

            // Wait a tiny bit for the DOM to be ready and rendered
            const timer = setTimeout(() => {
                if (hourWheelRef.current) {
                    hourWheelRef.current.scrollTop = (h12 - 1) * 56;
                }
                if (periodWheelRef.current) {
                    periodWheelRef.current.scrollTop = periodIdx * 56;
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [showWheel, form.scheduledHour]);

    // Deletion states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Chapter deletion states
    const [chapterToDelete, setChapterToDelete] = useState<number | null>(null);
    const [isDeletingChapter, setIsDeletingChapter] = useState(false);

    const handleDeleteChapter = async () => {
        if (!chapterToDelete) return;

        setIsDeletingChapter(true);
        try {
            const res = await fetch(`/api/novel/chapter/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapterId: chapterToDelete,
                    novelSlug: novel.slug
                })
            });
            const data = await res.json();

            if (data.success) {
                setAlert({
                    isOpen: true,
                    title: translations.successTitle,
                    message: "Chapter deleted successfully",
                    type: 'success'
                });
                router.refresh();
            } else {
                setAlert({
                    isOpen: true,
                    title: "Error",
                    message: data.error || "Failed to delete chapter",
                    type: 'error'
                });
            }
        } catch (error) {
            setAlert({
                isOpen: true,
                title: "Error",
                message: "An unexpected error occurred",
                type: 'error'
            });
        } finally {
            setIsDeletingChapter(false);
            setChapterToDelete(null);
        }
    };

    const handleDeleteNovel = async () => {
        if (!deletePassword) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/author/novels/${novel.slug}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword })
            });
            const data = await res.json();

            if (data.success) {
                router.push('/writer');
            } else {
                setAlert({
                    isOpen: true,
                    title: translations.successTitle === 'Success' ? 'Error' : 'အမှား',
                    message: data.error === 'Invalid password' ? translations.invalidPassword : data.error,
                    type: 'error'
                });
            }
        } catch (error) {
            setAlert({
                isOpen: true,
                title: 'Error',
                message: 'Failed to delete novel',
                type: 'error'
            });
        } finally {
            setIsDeleting(false);
            setDeletePassword('');
            setIsDeleteModalOpen(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/author/novels/${novel.slug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                setAlert({
                    isOpen: true,
                    title: translations.successTitle,
                    message: translations.successUpdate,
                    type: 'success'
                });
                router.refresh();
            } else {
                setAlert({
                    isOpen: true,
                    title: "Error",
                    message: data.error || "Failed to update novel",
                    type: 'error'
                });
            }
        } catch (error) {
            setAlert({
                isOpen: true,
                title: "Error",
                message: "An unexpected error occurred",
                type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header with quick stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-24 bg-muted rounded-lg overflow-hidden border border-border shadow-sm shrink-0">
                        {novel.coverUrl ? (
                            <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">📚</div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">{novel.title}</h1>
                        <div className="flex flex-col items-start gap-2 mt-1">
                            <Badge variant="outline" className="capitalize px-2 py-0 font-bold border-primary/20 text-primary bg-primary/5">{novel.status}</Badge>
                            <span className="text-sm text-muted-foreground font-medium italic opacity-90 leading-none pb-1">
                                Updated {new Date().toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-[340px] mx-auto md:flex md:w-auto md:max-w-none md:mx-0 mt-6 md:mt-0 shrink-0">
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full md:w-auto rounded-xl bg-background text-primary shadow-lg border-primary/10 hover:bg-background hover:text-primary hover:shadow-lg font-bold px-5 h-11 transition-none"
                    >
                        <Link href={`/novel/${novel.slug}`}>
                            Public View
                        </Link>
                    </Button>
                    <Button
                        asChild
                        size="sm"
                        className="w-full md:w-auto rounded-xl bg-[var(--action)] hover:bg-[var(--action)]/90 font-bold shadow-xl shadow-[var(--action)]/20 px-5 h-11"
                    >
                        <Link href={`/novel/${novel.slug}/create`}>
                            {translations.addChapter}
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="inline-flex h-14 items-center justify-start rounded-xl bg-muted/50 p-1 text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap w-full sm:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scrollbar-hide">
                    <TabsTrigger
                        value="overview"
                        className="inline-flex h-full items-center justify-center whitespace-nowrap rounded-lg px-6 text-base font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-primary/10 gap-2"
                    >
                        {translations.overview}
                    </TabsTrigger>
                    <TabsTrigger
                        value="chapters"
                        className="inline-flex h-full items-center justify-center whitespace-nowrap rounded-lg px-6 text-base font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-primary/10 gap-2"
                    >
                        {translations.chapters}
                        <Badge variant="secondary" className="ml-1 px-2 py-0 h-5 font-black bg-primary/10 text-primary border-none">
                            {chapters.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                        value="settings"
                        className="inline-flex h-full items-center justify-center whitespace-nowrap rounded-lg px-6 text-base font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-primary/10 gap-2"
                    >
                        {translations.settings}
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="rounded-2xl border-border shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold text-muted-foreground">{translations.totalViews}</CardTitle>
                                <TrendingUp size={16} className="text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">{novel.views.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground font-semibold mt-1 flex items-center gap-1">
                                    <TrendingUp size={12} /> +12% this week
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border-border shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold text-muted-foreground">{translations.collectors}</CardTitle>
                                <Bookmark size={16} className="text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">{collectorCount.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground font-semibold mt-1">Active readers</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border-border shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold text-muted-foreground">{translations.publishedChapters}</CardTitle>
                                <BookOpen size={16} className="text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">{chapters.length}</div>
                                <p className="text-xs text-muted-foreground font-semibold mt-1">Total content</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border-border shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold text-muted-foreground">{translations.novelStatus}</CardTitle>
                                <Clock size={16} className="text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-black capitalize">{form.status}</div>
                                <p className="text-xs text-muted-foreground font-semibold mt-1">Latest update today</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/10">
                            <CardTitle className="text-lg font-black">{translations.recentPerformance}</CardTitle>
                            <CardDescription>Engagement metrics over time</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[240px] flex flex-col items-center justify-center bg-muted/5">
                            <div className="flex flex-col items-center opacity-30">
                                <div className="flex gap-4 items-end h-32 mb-4">
                                    <div className="w-8 bg-primary h-12 rounded-t-lg" />
                                    <div className="w-8 bg-primary h-20 rounded-t-lg" />
                                    <div className="w-8 bg-primary h-16 rounded-t-lg" />
                                    <div className="w-8 bg-primary h-24 rounded-t-lg" />
                                    <div className="w-8 bg-primary h-32 rounded-t-lg" />
                                    <div className="w-8 bg-primary h-28 rounded-t-lg" />
                                </div>
                                <p className="text-sm font-bold">Chart data processing...</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Chapters Tab */}
                <TabsContent value="chapters" className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-baseline md:items-center gap-1">
                            <h3 className="text-xl font-black leading-none">{translations.chapters}</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all ml-0.5"
                                title={sortOrder === 'asc' ? 'Sort by Oldest' : 'Sort by Newest'}
                            >
                                <ArrowUpDown size={22} className={sortOrder === 'asc' ? 'rotate-180 transition-transform duration-300' : 'transition-transform duration-300'} />
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsBulkUploadOpen(true)}
                                size="sm"
                                className="rounded-xl gap-2 font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 shadow-sm h-10 px-5"
                            >
                                <Upload size={16} />
                                File Upload
                            </Button>
                        </div>
                    </div>

                    {isBulkUploadOpen && (
                        <BulkUploadModal
                            novelId={novel.id}
                            novelSlug={novel.slug}
                            volumes={volumes}
                            defaultVolumeId={chapters.length > 0 ? chapters.sort((a, b) => b.id - a.id)[0].volumeId?.toString() : undefined}
                            onClose={() => setIsBulkUploadOpen(false)}
                        />
                    )}

                    <div className="border border-border rounded-3xl overflow-hidden bg-background shadow-sm">
                        {chapters.length > 0 ? (
                            <div className="divide-y divide-border">
                                {chapters.sort((a, b) => sortOrder === 'asc' ? a.sortIndex - b.sortIndex : b.sortIndex - a.sortIndex).map((chapter) => (
                                    <div key={chapter.id} className="p-5 hover:bg-muted/40 transition-all flex items-center justify-between gap-4 group cursor-pointer">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-lg text-[var(--foreground)] truncate group-hover:text-[var(--action)] transition-colors">
                                                    {chapter.title}
                                                </h4>
                                                {chapter.status === 'scheduled' && (
                                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold border-amber-500/30 text-amber-600 bg-amber-500/5">
                                                        <Clock size={10} className="mr-1" />
                                                        Scheduled
                                                    </Badge>
                                                )}
                                                {chapter.status === 'draft' && (
                                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold border-muted-foreground/30 text-muted-foreground bg-muted/5">
                                                        Draft
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <span>{chapter.createdAt ? new Date(chapter.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'}</span>
                                                {chapter.status === 'scheduled' && chapter.publishedAt && (
                                                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                                                        • Will post on {new Date(chapter.publishedAt).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5">
                                                {chapter.isPaid && (
                                                    <div className="w-9 h-9 flex items-center justify-center text-amber-600 bg-amber-500/10 rounded-xl" title="Paid Chapter">
                                                        <Crown size={16} fill="currentColor" />
                                                    </div>
                                                )}

                                                <Button asChild variant="secondary" size="sm" className="h-9 px-3 rounded-xl font-bold bg-muted hover:bg-primary/10 hover:text-primary border-none shadow-sm transition-all whitespace-nowrap">
                                                    <Link href={`/novel/${novel.slug}/${chapter.sortIndex}/edit`}>
                                                        <Pencil size={15} className="mr-1.5" />
                                                        {translations.edit}
                                                    </Link>
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setChapterToDelete(chapter.id);
                                                    }}
                                                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-20 text-center bg-muted/5">
                                <div className="mx-auto w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                                    <BookOpen size={40} className="text-muted-foreground/50" />
                                </div>
                                <h4 className="text-xl font-black mb-2">Create your first chapter</h4>
                                <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-8">Ready to share your story? Add your first chapter and start reaching readers.</p>
                                <Button asChild className="rounded-2xl font-black bg-[var(--action)] hover:bg-[var(--action)]/90 px-10 h-12 shadow-xl shadow-[var(--action)]/20">
                                    <Link href={`/novel/${novel.slug}/create`}>Get Started</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 1. Scheduling Settings Button */}
                        <button
                            onClick={() => setOpenSetting('scheduling')}
                            className="flex items-center gap-4 p-5 rounded-3xl border border-border bg-background hover:bg-muted/30 hover:border-primary/20 transition-all text-left group shadow-sm"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${form.isScheduledMode ? 'bg-amber-500/10 text-amber-600' : 'bg-muted/50 text-muted-foreground'} group-hover:scale-110 transition-transform duration-300`}>
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-lg">Scheduling</h3>
                                <p className="text-xs text-muted-foreground font-medium">Auto-post chapters on schedule.</p>
                            </div>
                        </button>

                        {/* 2. Paid Settings Button */}
                        <button
                            onClick={() => setOpenSetting('paid')}
                            className="flex items-center gap-4 p-5 rounded-3xl border border-border bg-background hover:bg-muted/30 hover:border-primary/20 transition-all text-left group shadow-sm"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Crown size={24} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg">{translations.paidSettings}</h3>
                                <p className="text-xs text-muted-foreground font-medium">Monetization & chapter pricing.</p>
                            </div>
                        </button>

                        {/* 3. Edit Detail Button */}
                        <button
                            onClick={() => setOpenSetting('detail')}
                            className="flex items-center gap-4 p-5 rounded-3xl border border-border bg-background hover:bg-muted/30 hover:border-primary/20 transition-all text-left group shadow-sm"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Pencil size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-lg">{translations.editNovelDetail}</h3>
                                <p className="text-xs text-muted-foreground font-medium">Update title, synopsis & tags.</p>
                            </div>
                        </button>

                        {/* 4. Danger Zone Button */}
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center gap-4 p-5 rounded-3xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-all text-left group shadow-sm"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-destructive">{translations.dangerZone}</h3>
                                <p className="text-xs text-destructive/60 font-medium font-medium">Delete novel forever.</p>
                            </div>
                        </button>
                    </div>

                </TabsContent>
            </Tabs>

            {/* Scheduling Settings Dialog */}
            <Dialog open={openSetting === 'scheduling'} onOpenChange={(open) => !open && setOpenSetting(null)}>
                <DialogContent className="rounded-3xl border-border bg-background shadow-2xl p-0 overflow-hidden max-w-2xl">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                            <Clock className="text-amber-500" size={28} />
                            Scheduling
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-8 pt-4 space-y-8">
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50">
                            <div>
                                <p className="font-black text-sm">Auto-Schedule Mode</p>
                            </div>
                            <div
                                onClick={() => setForm(prev => ({ ...prev, isScheduledMode: !prev.isScheduledMode }))}
                                className={`h-6 w-11 rounded-full p-1 transition-all duration-300 cursor-pointer relative ${form.isScheduledMode ? 'bg-[#00afa9]' : 'bg-[#dbdce0]'}`}
                            >
                                <div className={`absolute top-1 left-1 bg-white rounded-full h-4 w-4 shadow-sm transition-transform duration-300 ${form.isScheduledMode ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        {form.isScheduledMode && (
                            <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2">
                                {/* Time Selection Row (iOS Style) */}
                                <div className="space-y-3 relative">
                                    <div
                                        onClick={() => setShowWheel(!showWheel)}
                                        className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50 cursor-pointer hover:bg-muted/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Clock size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                            <p className="font-black text-sm uppercase tracking-wider text-muted-foreground font-inter">Posting Time</p>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-lg font-black text-lg transition-all ${showWheel ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-primary/10 text-primary'}`}>
                                            {form.scheduledHour % 12 || 12}:00 {form.scheduledHour < 12 ? 'AM' : 'PM'}
                                        </div>
                                    </div>

                                    {showWheel && (
                                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                                            {/* Backdrop */}
                                            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowWheel(false)} />

                                            {/* Centered Box */}
                                            <div className="relative w-full max-w-sm bg-background border border-border shadow-2xl rounded-[40px] p-8 animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div>
                                                        <h3 className="text-xl font-black">Select Time</h3>
                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">12-Hour Format</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowWheel(false)}
                                                        className="h-10 px-6 rounded-full bg-primary text-white font-black text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                                                    >
                                                        Done
                                                    </button>
                                                </div>

                                                <div className="relative h-56 flex items-center justify-center bg-muted/5 rounded-[32px] border border-border/30 overflow-hidden shadow-inner gap-4">
                                                    {/* Central Indicator */}
                                                    <div className="absolute h-14 w-[calc(100%-32px)] bg-primary/5 border-y border-primary/10 z-0 rounded-xl" />
                                                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/90 to-transparent z-10" />
                                                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/90 to-transparent z-10" />

                                                    {/* Hour Wheel (1-12) */}
                                                    <div className="flex-[1.5] h-full overflow-y-auto snap-y snap-mandatory no-scrollbar z-20 py-[84px]"
                                                        ref={hourWheelRef}
                                                        onScroll={(e) => {
                                                            const el = e.currentTarget;
                                                            const h12 = Math.round(el.scrollTop / 56) + 1;
                                                            if (h12 >= 1 && h12 <= 12) {
                                                                const isPM = form.scheduledHour >= 12;
                                                                const h24 = (h12 % 12) + (isPM ? 12 : 0);
                                                                if (h24 !== form.scheduledHour) setForm(prev => ({ ...prev, scheduledHour: h24 }));
                                                            }
                                                        }}
                                                    >
                                                        {Array.from({ length: 12 }).map((_, i) => (
                                                            <div key={i} className={`h-14 flex items-center justify-end pr-1 snap-center text-2xl font-black transition-all ${(form.scheduledHour % 12 || 12) === i + 1 ? 'text-primary scale-105' : 'text-muted-foreground/10'}`}>
                                                                {(i + 1).toString().padStart(2, '0')}:00
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* AM/PM Wheel */}
                                                    <div className="flex-1 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar z-20 py-[84px]"
                                                        ref={periodWheelRef}
                                                        onScroll={(e) => {
                                                            const el = e.currentTarget;
                                                            const periodIdx = Math.round(el.scrollTop / 56);
                                                            if (periodIdx === 0 || periodIdx === 1) {
                                                                const h12 = form.scheduledHour % 12 || 12;
                                                                const h24 = (h12 % 12) + (periodIdx === 1 ? 12 : 0);
                                                                if (h24 !== form.scheduledHour) setForm(prev => ({ ...prev, scheduledHour: h24 }));
                                                            }
                                                        }}
                                                    >
                                                        {['AM', 'PM'].map((p, i) => (
                                                            <div key={p} className={`h-14 flex items-center justify-start pl-2 snap-center text-xl font-black transition-all ${(form.scheduledHour < 12 ? 0 : 1) === i ? 'text-primary scale-105' : 'text-muted-foreground/20'}`}>
                                                                {p}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Chapters Count Input */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">တစ်နေ့လျှင် တင်မည့် အခန်းအရေအတွက်</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={24}
                                        value={form.chaptersPerDay}
                                        onChange={(e) => setForm({ ...form, chaptersPerDay: Number(e.target.value) })}
                                        className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-black text-lg"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center pt-8 border-t border-border/50">
                            <Button
                                size="lg"
                                className="px-16 rounded-full font-black shadow-2xl shadow-primary/30 active:scale-95 transition-all text-lg"
                                disabled={isSaving}
                                onClick={async () => {
                                    await handleSave();
                                    setOpenSetting(null);
                                }}
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Paid Settings Dialog */}
            <Dialog open={openSetting === 'paid'} onOpenChange={(open) => !open && setOpenSetting(null)}>
                <DialogContent className="rounded-3xl border-border bg-background shadow-2xl p-0 overflow-hidden max-w-2xl">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                            <Crown className="text-amber-500" size={28} fill="currentColor" />
                            {translations.paidSettings}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium pt-2">
                            Manage chapter monetization and price.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-8 pt-4 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-sm font-black ml-1 uppercase tracking-wider text-muted-foreground">{translations.pricePerChapter}</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={form.chapterPrice}
                                        onChange={(e) => setForm({ ...form, chapterPrice: Number(e.target.value) })}
                                        className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-black text-xl pl-12"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        🪙
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-black ml-1 uppercase tracking-wider text-muted-foreground">{translations.paidRange}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground/60 ml-1">{translations.fromChapter}</span>
                                        <Input
                                            type="number"
                                            value={form.paidFrom}
                                            onChange={(e) => setForm({ ...form, paidFrom: Number(e.target.value) })}
                                            className="h-10 rounded-xl bg-muted/20 border-border focus:bg-background transition-all font-bold"
                                            placeholder="e.g. 5"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground/60 ml-1">{translations.toChapter}</span>
                                        <Input
                                            type="number"
                                            value={form.paidTo}
                                            onChange={(e) => setForm({ ...form, paidTo: Number(e.target.value) })}
                                            className="h-10 rounded-xl bg-muted/20 border-border focus:bg-background transition-all font-bold"
                                            placeholder="e.g. 100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                            <Button
                                className="w-full rounded-xl font-black bg-[var(--action)] hover:bg-[var(--action)]/90 gap-2 h-11 shadow-lg shadow-[var(--action)]/20 active:scale-95 transition-all"
                                disabled={isSaving}
                                onClick={async () => {
                                    await handleSave();
                                    setOpenSetting(null);
                                }}
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {translations.saveChanges}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Detail Dialog */}
            <Dialog open={openSetting === 'detail'} onOpenChange={(open) => !open && setOpenSetting(null)}>
                <DialogContent className="rounded-3xl border-border bg-background shadow-2xl p-0 overflow-hidden max-w-3xl">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                            <Pencil className="text-primary" size={28} />
                            {translations.editNovelDetail}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium pt-2">
                            Update cover title, synopsis and tags metadata.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-8 pt-4 space-y-8 scroll-auto max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-sm font-black ml-1 uppercase tracking-wider text-muted-foreground">{translations.novelTitle}</label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-bold text-lg"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-black ml-1 uppercase tracking-wider text-muted-foreground">{translations.authorName}</label>
                                <Input
                                    value={form.author}
                                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                                    className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-bold text-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-black ml-1 uppercase tracking-wider text-muted-foreground">{translations.synopsis}</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full min-h-[150px] p-5 rounded-2xl border border-border bg-muted/20 focus:bg-background outline-none transition-all text-base leading-relaxed font-medium"
                                placeholder="..."
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-black ml-1 uppercase tracking-wider text-muted-foreground">{translations.tags}</label>
                            <Input
                                value={form.tags}
                                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                                className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-medium"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-black ml-1 uppercase tracking-wider text-muted-foreground">{translations.novelStatus}</label>
                            <Select
                                value={form.status}
                                onValueChange={(val) => setForm({ ...form, status: val })}
                            >
                                <SelectTrigger className="h-11 rounded-xl font-bold bg-muted/20">
                                    <SelectValue placeholder="..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="ongoing">{translations.statusOngoing}</SelectItem>
                                    <SelectItem value="completed">{translations.statusCompleted}</SelectItem>
                                    <SelectItem value="hiatus">{translations.statusHiatus}</SelectItem>
                                    <SelectItem value="dropped">{translations.statusDropped}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-4 border-t border-border/50 flex gap-4">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl font-black h-11"
                                onClick={() => setForm({
                                    ...form,
                                    title: novel.title,
                                    author: novel.author,
                                    description: novel.description || '',
                                    tags: novel.tags,
                                    status: novel.status || 'ongoing'
                                })}
                            >
                                {translations.discardChanges}
                            </Button>
                            <Button
                                className="flex-1 rounded-xl font-black bg-[var(--action)] hover:bg-[var(--action)]/90 gap-2 h-11 shadow-lg shadow-[var(--action)]/20 active:scale-95 transition-all"
                                disabled={isSaving}
                                onClick={async () => {
                                    await handleSave();
                                    setOpenSetting(null);
                                }}
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {translations.saveChanges}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="rounded-3xl border-border bg-background shadow-2xl p-0 overflow-hidden max-w-sm sm:max-w-md">
                    <DialogHeader className="p-8 pb-4">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <DialogTitle className="text-2xl font-black text-foreground">
                            {translations.deleteConfirmTitle}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium pt-2">
                            {translations.deleteConfirmDesc}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-8 py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="passwordConfirm" className="font-black text-xs uppercase tracking-wider text-muted-foreground">
                                {translations.deleteConfirmPlaceholder}
                            </Label>
                            <Input
                                id="passwordConfirm"
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="h-12 rounded-xl bg-muted/20 border-border focus:bg-background transition-all"
                                placeholder="..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-2 grid grid-cols-2 gap-3 sm:space-x-0">
                        <Button
                            variant="ghost"
                            className="rounded-2xl font-black text-muted-foreground h-12"
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setDeletePassword('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="rounded-2xl font-black h-12 shadow-xl shadow-destructive/20 active:scale-95 transition-all"
                            disabled={!deletePassword || isDeleting}
                            onClick={handleDeleteNovel}
                        >
                            {isDeleting ? <Loader2 className="animate-spin" size={18} /> : translations.deletePermanently}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                isOpen={chapterToDelete !== null}
                onClose={() => setChapterToDelete(null)}
                onConfirm={handleDeleteChapter}
                title={translations.deleteChapter}
                message="Are you sure you want to delete this chapter? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive={true}
                isLoading={isDeletingChapter}
            />

            <AlertModal
                isOpen={alert.isOpen}
                onClose={() => setAlert({ ...alert, isOpen: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </div >
    );
}
