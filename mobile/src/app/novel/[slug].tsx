import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image as RNImage,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { API_URL } from '../index';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NovelDetail {
  id: number;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
  status: string | null;
  views: number | null;
  description: string | null;
  tags: string[] | string | null;
}

interface Volume {
  id: number;
  title: string;
  sortIndex: number;
}

interface Chapter {
  id: number;
  title: string;
  sortIndex: number;
  volumeId: number;
}

export default function NovelDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [novel, setNovel] = useState<NovelDetail | null>(null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [totalChapters, setTotalChapters] = useState<number>(0);
  const [loadingMoreChapters, setLoadingMoreChapters] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Load bookmark status on mount / slug change
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!slug) return;
      try {
        const bookmarksStr = await AsyncStorage.getItem('pyunovel_bookmarks');
        if (bookmarksStr) {
          const bookmarks = JSON.parse(bookmarksStr);
          const exists = bookmarks.some((b: any) => b.slug === slug);
          setIsBookmarked(exists);
        }
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };
    checkBookmarkStatus();
  }, [slug]);

  // Toggle bookmark
  const toggleBookmark = async () => {
    if (!novel) return;
    try {
      const bookmarksStr = await AsyncStorage.getItem('pyunovel_bookmarks');
      let bookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : [];
      
      if (isBookmarked) {
        bookmarks = bookmarks.filter((b: any) => b.slug !== slug);
        await AsyncStorage.setItem('pyunovel_bookmarks', JSON.stringify(bookmarks));
        setIsBookmarked(false);
      } else {
        const newBookmark = {
          id: novel.id,
          title: novel.title,
          slug: novel.slug,
          author: novel.author,
          coverUrl: novel.coverUrl,
          status: novel.status,
          views: novel.views,
          bookmarkedAt: Date.now()
        };
        bookmarks.push(newBookmark);
        await AsyncStorage.setItem('pyunovel_bookmarks', JSON.stringify(bookmarks));
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleLoadMoreChapters = async () => {
    if (loadingMoreChapters || !slug) return;
    try {
      setLoadingMoreChapters(true);
      const offset = chapters.length;
      const res = await fetch(`${API_URL}/api/public/novel/${slug}/chapters?offset=${offset}&limit=50`);
      const json = await res.json();
      if (json.success && json.chapters) {
        setChapters(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const newChs = json.chapters.filter((c: any) => !existingIds.has(c.id));
          return [...prev, ...newChs];
        });
      }
    } catch (error) {
      console.error('Error loading more chapters on mobile:', error);
    } finally {
      setLoadingMoreChapters(false);
    }
  };

  useEffect(() => {
    const fetchNovelDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/api/public/novel/${slug}`);
        const json = await response.json();
        if (json.success) {
          setNovel(json.novel);
          setVolumes(json.volumes || []);
          setChapters(json.chapters || []);
          setTotalChapters(json.totalChapters || json.chapters?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching novel detail:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchNovelDetails();
    }
  }, [slug]);

  const getCoverUrl = (url: string | null) => {
    if (!url) return 'https://placehold.co/150x220/png?text=No+Cover';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_URL}${url}`;
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3c87f7" />
      </ThemedView>
    );
  }

  if (!novel) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>Novel not found</ThemedText>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Parse tags helper
  const parsedTags: string[] = typeof novel.tags === 'string' 
    ? JSON.parse(novel.tags) 
    : Array.isArray(novel.tags) 
      ? novel.tags 
      : [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back navigation header */}
        <TouchableOpacity style={styles.navHeader} onPress={() => router.back()}>
          <ThemedText style={styles.navBackText}>← Back</ThemedText>
        </TouchableOpacity>

        {/* Novel Hero Card */}
        <ThemedView style={styles.heroCard}>
          <RNImage source={{ uri: getCoverUrl(novel.coverUrl) }} style={styles.coverImage} />
          <ThemedView style={styles.metaContainer}>
            <ThemedText style={styles.titleText}>{novel.title}</ThemedText>
            <ThemedText type="small" style={styles.authorText}>By {novel.author}</ThemedText>
            
            <ThemedView style={styles.badgeRow}>
              {novel.status && (
                <ThemedView style={styles.statusBadge}>
                  <ThemedText style={styles.badgeText}>{novel.status}</ThemedText>
                </ThemedView>
              )}
              {novel.views !== null && (
                <ThemedText type="small" style={styles.viewsText}>👁️ {novel.views} views</ThemedText>
              )}
            </ThemedView>

            <TouchableOpacity 
              style={[
                styles.bookmarkBtn, 
                isBookmarked ? styles.bookmarkedBtn : styles.unbookmarkedBtn
              ]} 
              onPress={toggleBookmark}
              activeOpacity={0.7}
            >
              <ThemedText style={isBookmarked ? styles.bookmarkBtnTextActive : styles.bookmarkBtnText}>
                {isBookmarked ? '❤️ In Library' : '🖤 Add to Library'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* Tags */}
        {parsedTags.length > 0 && (
          <ThemedView style={styles.tagsContainer}>
            {parsedTags.map((tag, idx) => (
              <ThemedView key={idx} style={styles.tagBadge}>
                <ThemedText style={styles.tagText}>{tag}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {/* Description / Synopsis */}
        <ThemedView style={styles.synopsisContainer}>
          <ThemedText type="smallBold" style={styles.sectionHeader}>Synopsis</ThemedText>
          <ThemedText type="small" style={styles.descriptionText}>
            {novel.description || 'No description available.'}
          </ThemedText>
        </ThemedView>

        {/* Chapters Section */}
        <ThemedView style={styles.chaptersContainer}>
          <ThemedText type="smallBold" style={styles.sectionHeader}>Chapters</ThemedText>
          
          {chapters.length === 0 ? (
            <ThemedText type="small" style={styles.noChaptersText}>No chapters published yet.</ThemedText>
          ) : (
            // Group chapters by volume
            volumes.map((vol) => {
              const volChapters = chapters.filter((ch) => ch.volumeId === vol.id);
              if (volChapters.length === 0) return null;
              
              return (
                <ThemedView key={vol.id} style={styles.volumeBlock}>
                  <ThemedText style={styles.volumeTitle}>{vol.title}</ThemedText>
                  {volChapters.map((ch) => (
                    <TouchableOpacity
                      key={ch.id}
                      style={styles.chapterItem}
                      onPress={() => router.push(`/novel/${slug}/chapter/${ch.sortIndex}`)}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={styles.chapterItemText}>{ch.title}</ThemedText>
                      <ThemedText style={styles.chapterChevron}>→</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              );
            })
          )}

          {/* Fallback for chapters without a volume */}
          {chapters.filter((ch) => !ch.volumeId).length > 0 && (
            <ThemedView style={styles.volumeBlock}>
              <ThemedText style={styles.volumeTitle}>Unassigned Chapters</ThemedText>
              {chapters.filter((ch) => !ch.volumeId).map((ch) => (
                <TouchableOpacity
                  key={ch.id}
                  style={styles.chapterItem}
                  onPress={() => router.push(`/novel/${slug}/chapter/${ch.sortIndex}`)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.chapterItemText}>{ch.title}</ThemedText>
                  <ThemedText style={styles.chapterChevron}>→</ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          )}

          {/* Load More Button */}
          {chapters.length < totalChapters && (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={handleLoadMoreChapters}
              disabled={loadingMoreChapters}
              activeOpacity={0.7}
            >
              {loadingMoreChapters ? (
                <ActivityIndicator size="small" color="#3c87f7" />
              ) : (
                <ThemedText style={styles.loadMoreBtnText}>
                  Load More Chapters ({chapters.length} of {totalChapters})
                </ThemedText>
              )}
            </TouchableOpacity>
          )}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#3c87f7',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  navHeader: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  navBackText: {
    color: '#3c87f7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroCard: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  coverImage: {
    width: 110,
    height: 160,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  metaContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.one,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  authorText: {
    fontSize: 14,
    color: '#64748b',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  statusBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  viewsText: {
    color: '#64748b',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  tagBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#64748b',
  },
  synopsisContainer: {
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  chaptersContainer: {
    marginTop: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  noChaptersText: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  volumeBlock: {
    marginBottom: Spacing.four,
  },
  volumeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    marginBottom: Spacing.two,
    borderRadius: 4,
  },
  chapterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  chapterItemText: {
    fontSize: 14,
    flex: 1,
  },
  chapterChevron: {
    color: '#3c87f7',
    fontWeight: 'bold',
  },
  loadMoreBtn: {
    marginVertical: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: 'rgba(60, 135, 247, 0.08)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreBtnText: {
    color: '#3c87f7',
    fontSize: 13,
    fontWeight: '700',
  },
  bookmarkBtn: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  unbookmarkedBtn: {
    backgroundColor: 'transparent',
    borderColor: '#3c87f7',
  },
  bookmarkedBtn: {
    backgroundColor: '#3c87f7',
    borderColor: '#3c87f7',
  },
  bookmarkBtnText: {
    color: '#3c87f7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookmarkBtnTextActive: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
