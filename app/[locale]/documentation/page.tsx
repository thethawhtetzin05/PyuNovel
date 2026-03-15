'use client';
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Smartphone,
    Monitor,
    BookOpen,
    User,
    Bookmark,
    Zap,
    PenTool,
    Send,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Info
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function ManualPage() {
    const t = useTranslations('Manual');
    const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            if (window.innerWidth < 1024) setViewMode('mobile');
            else setViewMode('desktop');
        };
        checkDevice();
        setIsLoaded(true);
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    if (!isLoaded) return null;

    const SectionCard = ({ icon: Icon, title, children, colorClass }: any) => (
        <section className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            <div className={`p-8 md:p-10 border-b border-border ${colorClass}`}>
                <div className="flex items-center gap-4">
                    <Icon className="text-primary" size={32} />
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{title}</h2>
                </div>
            </div>
            <div className="p-8 md:p-10 space-y-8">
                {children}
            </div>
        </section>
    );

    const StepItem = ({ text, number }: { text: string; number?: number }) => (
        <div className="flex gap-4 group">
            <div className="mt-1 shrink-0">
                {number ? (
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black">
                        {number}
                    </div>
                ) : (
                    <CheckCircle2 size={20} className="text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
            <p className="text-lg leading-relaxed text-foreground/90">{text}</p>
        </div>
    );

    const SubSection = ({ title, steps }: { title: string; steps: string[] }) => (
        <div className="space-y-4 p-6 bg-muted/30 rounded-3xl border border-border/50">
            <h4 className="text-lg font-black flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                {title}
            </h4>
            <div className="grid gap-3">
                {steps.map((step, idx) => (
                    <StepItem key={idx} text={step} number={idx + 1} />
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent pt-6 pb-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Header Section */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <Badge variant="outline" className="mb-4 px-4 py-1 rounded-full border-primary/30 text-primary font-bold">
                        PYUNOVEL GUIDE
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {t('title')}
                    </h1>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
                        {t('description')}
                    </p>
                </div>

                {/* View Switcher Panel */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 p-8 bg-card/50 backdrop-blur-sm border border-border rounded-[2rem] shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-primary/10 rounded-3xl text-primary shadow-inner">
                            {viewMode === 'mobile' ? <Smartphone size={32} /> : <Monitor size={32} />}
                        </div>
                        <div>
                            <h3 className="font-black text-xl mb-1">{t('viewMode')}</h3>
                            <p className="text-sm text-muted-foreground font-medium">
                                Detected: <span className="text-primary uppercase tracking-wider">{viewMode}</span>
                            </p>
                        </div>
                    </div>

                    <Select value={viewMode} onValueChange={(val: any) => setViewMode(val)}>
                        <SelectTrigger className="w-full md:w-[260px] h-14 rounded-2xl font-black text-lg border-2 bg-background hover:bg-muted/50 transition-colors">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl font-bold p-2">
                            <SelectItem value="mobile" className="py-4 rounded-xl cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <Smartphone size={18} />
                                    {t('mobile')}
                                </div>
                            </SelectItem>
                            <SelectItem value="desktop" className="py-4 rounded-xl cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <Monitor size={18} />
                                    {t('desktop')}
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Expanded Sections */}
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">

                    {/* 1. Auth */}
                    <SectionCard icon={User} title={t('sections.auth.title')} colorClass="bg-blue-500/5">
                        <div className="grid gap-6">
                            <StepItem text={t('sections.auth.step1')} />
                            <StepItem text={t('sections.auth.step2')} />
                            <StepItem text={t('sections.auth.step3')} />
                        </div>
                    </SectionCard>

                    {/* 2. Reading */}
                    <SectionCard icon={BookOpen} title={t('sections.reading.title')} colorClass="bg-primary/5">
                        <div className="space-y-8">
                            <div className="p-6 bg-muted/50 rounded-3xl border border-border/50">
                                <p className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                                    <Info size={20} />
                                    Quick Start
                                </p>
                                <p className="text-lg opacity-90">{t('sections.reading.browsing')}</p>
                                <p className="text-lg mt-2 opacity-90">{t('sections.reading.steps')}</p>
                            </div>

                            <div className="grid gap-6">
                                {viewMode === 'mobile' ? (
                                    <>
                                        <StepItem text={t('sections.reading.mobile.nav')} />
                                        <StepItem text={t('sections.reading.mobile.toc')} />
                                        <StepItem text={t('sections.reading.mobile.comment')} />
                                    </>
                                ) : (
                                    <>
                                        <StepItem text={t('sections.reading.desktop.nav')} />
                                        <StepItem text={t('sections.reading.desktop.toc')} />
                                        <StepItem text={t('sections.reading.desktop.wide')} />
                                    </>
                                )}
                            </div>
                        </div>
                    </SectionCard>

                    {/* 3. Collection */}
                    <SectionCard icon={Bookmark} title={t('sections.collection.title')} colorClass="bg-amber-500/5">
                        <StepItem text={t('sections.collection.desc')} />
                    </SectionCard>

                    {/* 4. Daily */}
                    <SectionCard icon={Zap} title={t('sections.daily.title')} colorClass="bg-yellow-500/5">
                        <div className="grid gap-6">
                            <StepItem text={t('sections.daily.step1')} />
                            <StepItem text={t('sections.daily.step2')} />
                        </div>
                    </SectionCard>

                    {/* 5. Detailed Writers Guide */}
                    <SectionCard icon={PenTool} title={t('sections.writers.title')} colorClass="bg-purple-500/5">
                        <div className="space-y-10">
                            {/* Novels Management */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black bg-purple-500/10 text-purple-600 px-6 py-2 rounded-full w-fit">
                                    {t('sections.writers.novels.title')}
                                </h3>
                                <div className="grid gap-6 ml-2">
                                    <SubSection
                                        title={t('sections.writers.novels.create.title')}
                                        steps={[
                                            t('sections.writers.novels.create.steps.0'),
                                            t('sections.writers.novels.create.steps.1'),
                                            t('sections.writers.novels.create.steps.2'),
                                            t('sections.writers.novels.create.steps.3'),
                                            t('sections.writers.novels.create.steps.4'),
                                            t('sections.writers.novels.create.steps.5')
                                        ]}
                                    />
                                    <SubSection
                                        title={t('sections.writers.novels.edit.title')}
                                        steps={[
                                            t('sections.writers.novels.edit.steps.0'),
                                            t('sections.writers.novels.edit.steps.1'),
                                            t('sections.writers.novels.edit.steps.2')
                                        ]}
                                    />
                                    <SubSection
                                        title={t('sections.writers.novels.delete.title')}
                                        steps={[
                                            t('sections.writers.novels.delete.steps.0'),
                                            t('sections.writers.novels.delete.steps.1')
                                        ]}
                                    />
                                </div>
                            </div>

                            <hr className="border-border/50" />

                            {/* Chapters Management */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black bg-blue-500/10 text-blue-600 px-6 py-2 rounded-full w-fit">
                                    {t('sections.writers.chapters.title')}
                                </h3>
                                <div className="grid gap-6 ml-2">
                                    <SubSection
                                        title={t('sections.writers.chapters.add.title')}
                                        steps={[
                                            t('sections.writers.chapters.add.steps.0'),
                                            t('sections.writers.chapters.add.steps.1'),
                                            t('sections.writers.chapters.add.steps.2'),
                                            t('sections.writers.chapters.add.steps.3')
                                        ]}
                                    />
                                    <SubSection
                                        title={t('sections.writers.chapters.edit.title')}
                                        steps={[
                                            t('sections.writers.chapters.edit.steps.0'),
                                            t('sections.writers.chapters.edit.steps.1'),
                                            t('sections.writers.chapters.edit.steps.2')
                                        ]}
                                    />
                                    <SubSection
                                        title={t('sections.writers.chapters.delete.title')}
                                        steps={[
                                            t('sections.writers.chapters.delete.steps.0'),
                                            t('sections.writers.chapters.delete.steps.1')
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* 6. Telegram */}
                    <SectionCard icon={Send} title={t('sections.telegram.title')} colorClass="bg-sky-500/5">
                        <div className="grid gap-6">
                            <StepItem text={t('sections.telegram.step1')} />
                            <StepItem text={t('sections.telegram.step2')} />
                        </div>
                    </SectionCard>

                    {/* Final Note */}
                    <div className="relative overflow-hidden bg-primary/10 border border-primary/20 rounded-[2.5rem] p-12 text-center">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <CheckCircle2 size={120} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 tracking-tight">Happy Reading! 📖✨</h3>
                        <p className="text-lg font-medium text-muted-foreground italic leading-relaxed">
                            {t('footerNote')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
