'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Calendar, Crown, Folder, Pencil, Trash2, ChevronRight, UploadCloud, ChevronDown, ChevronUp } from "lucide-react";
import dynamic from 'next/dynamic';

const BulkUploadModal = dynamic(() => import('./bulk-upload-modal'), { ssr: false });

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

interface NovelTabsProps {
  novelSlug: string;
  novelId: number;
  description: string;
  chapters: Chapter[];
  volumes?: Volume[];
  isOwner?: boolean;
}

export default function NovelTabs({
  novelSlug,
  novelId,
  description,
  chapters,
  volumes = [],
  isOwner = false
}: NovelTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'about' | 'chapters'>('about');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [expandedVolumes, setExpandedVolumes] = useState<Record<string, boolean>>({});

  const toggleVolume = (volumeId: string) => {
    setExpandedVolumes(prev => ({ ...prev, [volumeId]: !prev[volumeId] }));
  };

  const handleDelete = async (e: React.MouseEvent, chapterId: string) => {
    e.preventDefault();

    if (confirm("Are you sure you want to delete this chapter? This action cannot be undone.")) {
      setIsDeleting(chapterId);
      try {
        const response = await fetch('/api/novel/chapter/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapterId, novelSlug }),
        });
        const res = await response.json() as { success: boolean; error?: string };
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || "Failed to delete chapter");
        }
      } catch (error) {
        alert("Failed to delete chapter");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const renderChapter = (chapter: Chapter) => (
    <div
      key={chapter.id}
      className={`group relative flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--action)]/50 hover:shadow-lg transition-all ${isDeleting === chapter.id ? "opacity-50 pointer-events-none" : ""
        }`}
    >
      <Link
        href={`/novel/${novelSlug}/${chapter.sortIndex}`}
        className="flex-1 flex items-center gap-4 min-w-0 cursor-pointer"
      >
        <span className="text-sm font-bold text-[var(--text-muted)] bg-[var(--surface-2)] px-3 py-1.5 rounded-lg min-w-[3.5rem] text-center group-hover:bg-[var(--action)]/10 group-hover:text-[var(--action)] transition-colors border border-[var(--border)]">
          #{chapter.sortIndex}
        </span>

        <div className="min-w-0">
          <h4 className="font-bold text-[var(--foreground)] group-hover:text-[var(--action)] transition-colors text-lg truncate pr-4">
            {chapter.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-1">
            <Calendar size={12} />
            <span>{new Date(chapter.createdAt || new Date()).toLocaleDateString()}</span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-3 shrink-0 pl-4 border-l border-[var(--border)] ml-4">
        {chapter.isPaid && (
          <div className="flex items-center gap-1 text-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-1 rounded-full text-xs font-bold border border-[var(--accent)]/30">
            <Crown size={12} fill="currentColor" />
            <span>VIP</span>
          </div>
        )}

        {isOwner && (
          <div className="flex items-center gap-2">
            <Link
              href={`/novel/${novelSlug}/${chapter.sortIndex}/edit`}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--action)] hover:bg-[var(--surface-2)] rounded-full transition-colors"
              title="Edit Chapter"
            >
              <Pencil size={18} />
            </Link>

            <button
              onClick={(e) => handleDelete(e, chapter.id)}
              className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
              title="Delete Chapter"
              disabled={isDeleting === chapter.id}
            >
              {isDeleting === chapter.id ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>
        )}

        {!isOwner && (
          <Link href={`/novel/${novelSlug}/${chapter.sortIndex}`}>
            <ChevronRight className="text-[var(--text-muted)] group-hover:text-[var(--action)] transition-colors" size={20} />
          </Link>
        )}
      </div>
    </div>
  );

  const unassignedChapters = chapters.filter(c => !c.volumeId);

  return (
    <>
      <div className="mt-8">
        {/* 1. Tab Headers */}
        <div className="flex gap-8 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-4 text-xl font-bold transition-all relative ${activeTab === 'about' ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
          >
            About
            {activeTab === 'about' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--action)] rounded-t-full"></div>}
          </button>

          <button
            onClick={() => setActiveTab('chapters')}
            className={`pb-4 text-xl font-bold transition-all relative flex items-center gap-2 ${activeTab === 'chapters' ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
          >
            Chapters
            <span className="text-xs bg-[var(--surface-2)] text-[var(--foreground)] px-2.5 py-0.5 rounded-full border border-[var(--border)] font-extrabold">
              {chapters.length}
            </span>
            {activeTab === 'chapters' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--action)] rounded-t-full"></div>}
          </button>
        </div>

        {/* 2. Content Area */}
        <div>
          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[17px] leading-8 text-[var(--text-muted)] whitespace-pre-line text-justify md:text-left font-serif">
                {description || "No synopsis available."}
              </p>
            </div>
          )}

          {/* CHAPTERS TAB */}
          {activeTab === 'chapters' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
              {/* Upload File button for owners */}
              {isOwner && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowBulkUpload(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold btn-primary transition-transform active:scale-95"
                  >
                    <UploadCloud size={16} />
                    Upload File
                  </button>
                </div>
              )}

              {chapters.length > 0 ? (
                <div className="space-y-6">
                  {/* Unassigned Chapters (Only show if there are actual unassigned chapters. And if there are volumes, give it a 'No Volume' header) */}
                  {unassignedChapters.length > 0 && (
                    <div className="space-y-3">
                      {volumes.length > 0 && (
                        <div
                          className="flex items-center justify-between cursor-pointer group"
                          onClick={() => toggleVolume('unassigned')}
                        >
                          <h3 className="font-bold text-[var(--foreground)] text-lg flex items-center gap-2 group-hover:text-[var(--action)] transition-colors">
                            <Folder size={20} className="text-[var(--action)]" />
                            No Volume
                          </h3>
                          {expandedVolumes['unassigned'] ? (
                            <ChevronUp size={20} className="text-[var(--text-muted)] group-hover:text-[var(--action)] transition-colors" />
                          ) : (
                            <ChevronDown size={20} className="text-[var(--text-muted)] group-hover:text-[var(--action)] transition-colors" />
                          )}
                        </div>
                      )}
                      {/* Show chapters if expanded, or if there are no volumes at all (so it defaults to always open) */}
                      {(!volumes.length || !expandedVolumes['unassigned']) && unassignedChapters.map(renderChapter)}
                    </div>
                  )}

                  {/* Volumes */}
                  {volumes.map(volume => {
                    const volumeChapters = chapters.filter(c => c.volumeId === volume.id);
                    if (volumeChapters.length === 0) return null;
                    const isExpanded = !expandedVolumes[volume.id.toString()]; // Default: Open

                    return (
                      <div key={volume.id} className="space-y-3 mt-8">
                        <div
                          className="flex items-center justify-between cursor-pointer group border-b border-[var(--border)] pb-2"
                          onClick={() => toggleVolume(volume.id.toString())}
                        >
                          <h3 className="font-bold text-[var(--foreground)] text-lg flex items-center gap-2 group-hover:text-[var(--action)] transition-colors">
                            <Folder size={20} className="text-[var(--action)]" />
                            {volume.name}
                          </h3>
                          {isExpanded ? (
                            <ChevronUp size={20} className="text-[var(--text-muted)] group-hover:text-[var(--action)] transition-colors" />
                          ) : (
                            <ChevronDown size={20} className="text-[var(--text-muted)] group-hover:text-[var(--action)] transition-colors" />
                          )}
                        </div>
                        {/* Chapters Container */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mb-0'}`}>
                          <div className="space-y-3 pb-2 pt-1">
                            {volumeChapters.map(renderChapter)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[var(--surface-2)] rounded-xl p-12 text-center border-2 border-dashed border-[var(--border)]">
                  <p className="text-[var(--text-muted)] font-medium text-lg">No chapters uploaded yet.</p>
                  <span className="text-[var(--text-muted)] opacity-60 text-sm mt-2 block">New chapters coming soon!</span>
                </div>
              )}
            </div>
          )}
        </div>
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
    </>
  );
}
