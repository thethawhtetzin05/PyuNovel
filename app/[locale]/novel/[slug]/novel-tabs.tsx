'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Calendar, Crown, Folder, Pencil, Trash2, ChevronRight, UploadCloud, ChevronDown, ChevronUp, MessageSquare, BookOpen, Info } from "lucide-react";
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { ConfirmModal, AlertModal } from '@/components/ui/Modals';

const BulkUploadModal = dynamic(() => import('./bulk-upload-modal'), { ssr: false });
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
  const router = useRouter();
  const t = useTranslations('Navbar');
  const [activeTab, setActiveTab] = useState(defaultTab || 'about');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [alertMsg, setAlertMsg] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [expandedVolumes, setExpandedVolumes] = useState<Record<string, boolean>>({});

  const toggleVolume = (volumeId: string) => {
    setExpandedVolumes(prev => ({ ...prev, [volumeId]: !prev[volumeId] }));
  };

  const handleDelete = (e: React.MouseEvent, chapter: Chapter) => {
    e.preventDefault();
    setChapterToDelete(chapter);
  };

  const confirmDelete = async () => {
    if (!chapterToDelete) return;

    setIsDeleting(chapterToDelete.id);
    try {
      const response = await fetch('/api/novel/chapter/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: chapterToDelete.id, novelSlug }),
      });
      const res = await response.json() as { success: boolean; error?: string };
      if (res.success) {
        router.refresh();
      } else {
        setAlertMsg(res.error || "Failed to delete chapter");
      }
    } catch {
      setAlertMsg("An error occurred while deleting the chapter");
    } finally {
      setIsDeleting(null);
      setChapterToDelete(null);
    }
  };

  const renderChapter = (chapter: Chapter) => (
    <div
      key={chapter.id}
      className={`group relative flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all ${isDeleting === chapter.id ? "opacity-50 pointer-events-none" : ""
        }`}
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
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/30 gap-1 font-bold">
            <Crown size={12} fill="currentColor" />
            VIP
          </Badge>
        )}

        {isOwner && (
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:text-primary hover:bg-primary/10">
              <Link href={`/novel/${novelSlug}/${chapter.sortIndex}/edit`} title="Edit Chapter">
                <Pencil size={18} />
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => handleDelete(e, chapter)}
              disabled={isDeleting === chapter.id}
              title="Delete Chapter"
            >
              {isDeleting === chapter.id ? (
                <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 size={18} />
              )}
            </Button>
          </div>
        )}

        {!isOwner && (
          <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" size={20} />
        )}
      </div>
    </div>
  );

  const unassignedChapters = chapters.filter(c => !c.volumeId);

  return (
    <>
      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <TabsTrigger
              value="about"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-4 text-lg font-bold transition-all gap-2"
            >
              <Info size={18} />
              About
            </TabsTrigger>
            <TabsTrigger
              value="chapters"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-4 text-lg font-bold transition-all gap-2"
            >
              <BookOpen size={18} />
              Chapters
              <Badge variant="secondary" className="ml-1 px-2 py-0 h-5 font-black bg-muted text-foreground border-none">
                {chapters.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-4 text-lg font-bold transition-all gap-2"
            >
              <MessageSquare size={18} />
              Reviews
              <Badge variant="secondary" className="ml-1 px-2 py-0 h-5 font-black bg-muted text-foreground border-none">
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
            {/* Upload File button for owners */}
            {isOwner && (
              <div className="flex justify-end">
                <Button onClick={() => setShowBulkUpload(true)} variant="outline" size="sm" className="gap-2 font-bold rounded-xl border-primary/30 hover:bg-primary/5 hover:text-primary">
                  <UploadCloud size={16} />
                  {t('bulkUpload')}
                </Button>
              </div>
            )}

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

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          novelId={novelId}
          novelSlug={novelSlug}
          volumes={volumes}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {chapterToDelete && (
        <ConfirmModal
          isOpen={!!chapterToDelete}
          onClose={() => setChapterToDelete(null)}
          onConfirm={confirmDelete}
          title="Delete Chapter"
          message={`Are you sure you want to delete "${chapterToDelete.title}"? This action cannot be undone.`}
          confirmText={isDeleting ? "Deleting..." : "Delete"}
          isDestructive={true}
        />
      )}

      {/* Alert Modal for Errors */}
      {alertMsg && (
        <AlertModal
          isOpen={!!alertMsg}
          onClose={() => setAlertMsg('')}
          title="Error"
          message={alertMsg}
          type="error"
        />
      )}
    </>
  );
}
