import React from 'react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NovelCardProps {
  novel: {
    title: string;
    slug: string;
    author: string;
    coverUrl: string | null;
    status?: "completed" | "ongoing" | "hiatus" | null;
  };
  variant?: 'default' | 'ranked';
  rank?: number;
  className?: string;
}

export const NovelCard = ({ novel, variant = 'default', rank, className }: NovelCardProps) => {
  if (variant === 'ranked') {
    return (
      <Link href={`/novel/${novel.slug}`} className={cn("group block", className)}>
        <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 aspect-[2/3]">
          <div className="relative w-full h-full bg-muted">
            {novel.coverUrl ? (
              <Image
                src={novel.coverUrl}
                alt={novel.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 50vw, 20vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">📚</div>
            )}
            
            {/* Premium Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Rank Overlay (More stylized) */}
            {rank !== undefined && (
              <div 
                className="absolute bottom-6 left-1 text-[70px] font-black italic leading-none pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity select-none"
                style={{ 
                  color: "transparent", 
                  WebkitTextStroke: "1.5px rgba(255,255,255,0.8)",
                  fontFamily: 'Bricolage Grotesque'
                }}
              >
                {rank}
              </div>
            )}

            {/* Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 pt-8">
              <div className="flex items-center gap-1.5 mb-1.5">
                 <Badge variant="secondary" className="bg-amber-500/90 text-white border-none text-[9px] h-4 px-1.5 font-bold">
                   TOP {rank}
                 </Badge>
              </div>
              <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-md group-hover:text-amber-300 transition-colors">
                {novel.title}
              </h3>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/novel/${novel.slug}`} className={cn("group flex flex-col gap-3", className)}>
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-muted border border-border shadow-sm group-hover:shadow-md group-hover:border-primary/30 transition-all duration-300">
        {novel.status && (
          <Badge className={cn(
            "absolute top-2 left-2 z-10 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 border-none",
            novel.status === 'ongoing' ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"
          )}>
            {novel.status}
          </Badge>
        )}
        {novel.coverUrl ? (
          <Image
            src={novel.coverUrl}
            alt={novel.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 16vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>
      
      <div className="flex flex-col px-0.5">
        <h3 className="text-foreground font-bold text-[14px] leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {novel.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 truncate font-medium group-hover:text-foreground transition-colors">
          {novel.author}
        </p>
      </div>
    </Link>
  );
};
