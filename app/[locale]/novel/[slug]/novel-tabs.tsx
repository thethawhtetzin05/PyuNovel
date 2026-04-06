'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter, usePathname } from '@/i18n/routing';
import { Calendar, Crown, Folder, ChevronRight, ChevronDown, ChevronUp, MessageSquare, BookOpen, Info } from "lucide-react";
import { useTranslations } from 'next-intl';
import ReviewSection from '@/components/novel/review-section';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface Volume {
  id: number;
  name: string;
  sortIndex: number;
}

interface Chapter {
  id: string;
  title: string;
  sortIndex: number;
  isPaid: boolean;
  createdAt: string | Date | null;
  volumeId: number | null;
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface NovelTabsProps {
  novelSlug: string;
  novelId: number;
  description: string;
  chapters: Chapter[];
  volumes?: Volume[];
  isOwner?: boolean;
  reviews?: Review[];
  userReview?: Record<string, unknown> | null;
  isLoggedIn?: boolean;
  defaultTab?: string;
}

export default function NovelTabs({
  novelSlug,
  novelId,
  description,
  chapters,
  volumes = [],
  isOwner = false,
  reviews = [],
  userReview = null,
  isLoggedIn = false,
  defaultTab,
}: NovelTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const activeTab = searchParams.get("tab") || defaultTab || "about";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };
  const [expandedVolumes, setExpandedVolumes] = useState<Record<string, boolean>>({});

  const toggleVolume = (volumeId: string) => {
    setExpandedVolumes(prev => ({ ...prev, [volumeId]: !prev[volumeId] }));
  };

  const renderChapter = (chapter: Chapter) => (
    <div
      key={chapter.id}
      className={`group relative flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all`}
    >
      <Link
        href={`/novel/${novelSlug}/${chapter.sortIndex}`}
        className="flex-1 flex items-center gap-4 min-w-0 cursor-pointer"
      >
        <div className="min-w-0">
          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg truncate pr-4">
            {chapter.title}
          </h4>
        </div>
      </Link>

      <div className="flex items-center gap-3 shrink-0 pl-4 border-l border-border ml-4">
        {chapter.isPaid && (
          <div className="w-9 h-9 flex items-center justify-center text-amber-600 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-sm" title="VIP Chapter">
            <Crown size={16} fill="currentColor" />
          </div>
        )}
        <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" size={20} />
      </div>
    </div>
  );

  const unassignedChapters = chapters.filter(c => !c.volumeId);

  return (
    <>
      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="inline-flex h-14 items-center justify-start rounded-xl bg-muted/50 p-1 text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap w-full sm:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scrollbar-hide">
            <TabsTrigger
              value="about"
              className="inline-flex h-full items-center justify-center whitespace-nowrap rounded-lg px-6 text-base font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-primary/10 gap-2"
            >
              Synopsis
            </TabsTrigger>
            <TabsTrigger
              value="chapters"
              className="inline-flex h-full items-center justify-center whitespace-nowrap rounded-lg px-6 text-base font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-primary/10 gap-2"
            >
              Chapters
              <Badge variant="secondary" className="ml-1 px-2 py-0 h-5 font-black bg-primary/10 text-primary border-none">
                {chapters.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="inline-flex h-full items-center justify-center whitespace-nowrap rounded-lg px-6 text-base font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-primary/10 gap-2"
            >
              Reviews
              <Badge variant="secondary" className="ml-1 px-2 py-0 h-5 font-black bg-primary/10 text-primary border-none">
                {reviews.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-0 focus-visible:outline-none">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[17px] leading-8 text-muted-foreground whitespace-pre-line text-justify md:text-left font-serif">
                {description || "No synopsis available."}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="chapters" className="mt-0 focus-visible:outline-none space-y-6">

            {chapters.length > 0 ? (
              <div className="space-y-8">
                {/* Unassigned Chapters */}
                {unassignedChapters.length > 0 && (
                  <div className="space-y-3">
                    {volumes.length > 0 && (
                      <div
                        className="flex items-center justify-between cursor-pointer group mb-2"
                        onClick={() => toggleVolume('unassigned')}
                      >
                        <h3 className="font-bold text-foreground text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                          <Folder size={20} className="text-primary" />
                          No Volume
                        </h3>
                        {expandedVolumes['unassigned'] ? (
                          <ChevronUp size={20} className="text-muted-foreground group-hover:text-primary" />
                        ) : (
                          <ChevronDown size={20} className="text-muted-foreground group-hover:text-primary" />
                        )}
                      </div>
                    )}
                    {(!volumes.length || !expandedVolumes['unassigned']) && (
                      <div className="space-y-3">
                        {unassignedChapters.map(renderChapter)}
                      </div>
                    )}
                  </div>
                )}

                {/* Volumes */}
                {volumes.map(volume => {
                  const volumeChapters = chapters.filter(c => c.volumeId === volume.id);
                  if (volumeChapters.length === 0) return null;
                  const isExpanded = !expandedVolumes[volume.id.toString()];

                  return (
                    <div key={volume.id} className="space-y-4">
                      <div
                        className="flex items-center justify-between cursor-pointer group"
                        onClick={() => toggleVolume(volume.id.toString())}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Folder size={20} />
                          </div>
                          <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                            {volume.name}
                          </h3>
                          <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-border">
                            {volumeChapters.length} Chapters
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={20} className="text-muted-foreground group-hover:text-primary" />
                        ) : (
                          <ChevronDown size={20} className="text-muted-foreground group-hover:text-primary" />
                        )}
                      </div>
                      <Separator className="bg-border/60" />

                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100 mt-2' : 'max-h-0 opacity-0 mb-0'}`}>
                        <div className="grid gap-3 pb-2 pt-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
                          {volumeChapters.map(renderChapter)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-2xl p-16 text-center border-2 border-dashed border-border">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BookOpen size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No chapters yet</h3>
                <p className="text-muted-foreground mt-2 max-w-xs mx-auto">New chapters coming soon! Check back later or follow the novel.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-0 focus-visible:outline-none">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ReviewSection
                novelId={novelId}
                novelSlug={novelSlug}
                reviews={reviews}
                userReview={userReview}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </>
  );
}
