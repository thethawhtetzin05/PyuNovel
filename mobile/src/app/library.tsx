import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  Image as RNImage,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { API_URL } from './index';

interface BookmarkedNovel {
  id: number;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
  status?: string | null;
  views?: number | null;
}

interface RecentProgress {
  novelId: number;
  novelTitle: string;
  novelSlug: string;
  novelCoverUrl: string | null;
  chapterId: number;
  chapterTitle: string;
  chapterIndex: number;
  readAt: number;
}

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'downloads'>('bookmarks');
  const [bookmarks, setBookmarks] = useState<BookmarkedNovel[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [recents, setRecents] = useState<RecentProgress[]>([]);

  const fetchLibraryData = async () => {
    try {
      const [bookmarksStr, recentsStr, downloadsStr] = await Promise.all([
        AsyncStorage.getItem('pyunovel_bookmarks'),
        AsyncStorage.getItem('pyunovel_recents'),
        AsyncStorage.getItem('pyunovel_download_catalog')
      ]);

      if (bookmarksStr) {
        setBookmarks(JSON.parse(bookmarksStr));
      } else {
        setBookmarks([]);
      }

      if (recentsStr) {
        setRecents(JSON.parse(recentsStr));
      } else {
        setRecents([]);
      }

      if (downloadsStr) {
        setDownloads(JSON.parse(downloadsStr));
      } else {
        setDownloads([]);
      }
    } catch (error) {
      console.error('Error fetching library data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookmarks whenever the screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLibraryData();
    });
    fetchLibraryData();
    return unsubscribe;
  }, [navigation]);

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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>My Library</ThemedText>
        </ThemedView>

        {/* Tab Switcher */}
        <ThemedView style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'bookmarks' && styles.tabBtnActive]}
            onPress={() => setActiveTab('bookmarks')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'bookmarks' && styles.tabTextActive]}>
              Bookmarks ({bookmarks.length})
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'downloads' && styles.tabBtnActive]}
            onPress={() => setActiveTab('downloads')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'downloads' && styles.tabTextActive]}>
              Downloads ({downloads.length})
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Recents Section */}
        {recents.length > 0 && (
          <ThemedView style={styles.recentsSection}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Continue Reading</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentsScroll}
            >
              {recents.map((item) => (
                <TouchableOpacity
                  key={item.novelId}
                  style={styles.recentCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/novel/${item.novelSlug}/chapter/${item.chapterIndex}`)}
                >
                  <RNImage source={{ uri: getCoverUrl(item.novelCoverUrl) }} style={styles.recentCover} />
                  <ThemedView style={styles.recentMeta}>
                    <ThemedText numberOfLines={1} style={styles.recentTitle}>{item.novelTitle}</ThemedText>
                    <ThemedText numberOfLines={1} type="small" style={styles.recentChapter} themeColor="textSecondary">
                      Ch. {item.chapterIndex} - {item.chapterTitle}
                    </ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>
        )}

        {activeTab === 'bookmarks' ? (
          bookmarks.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyEmoji}>📚</ThemedText>
              <ThemedText style={styles.emptyText} themeColor="textSecondary">
                No bookmarks yet.
              </ThemedText>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/explore')}
              >
                <ThemedText style={styles.exploreBtnText}>Explore Novels</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            <ThemedView style={styles.novelsGrid}>
              {bookmarks.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/novel/${item.slug}`)}
                >
                  <RNImage source={{ uri: getCoverUrl(item.coverUrl) }} style={styles.gridCover} />
                  <ThemedText numberOfLines={1} style={styles.gridTitle}>{item.title}</ThemedText>
                  <ThemedText numberOfLines={1} type="small" style={styles.gridAuthor}>{item.author}</ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          )
        ) : (
          /* Downloads Tab */
          downloads.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyEmoji}>💾</ThemedText>
              <ThemedText style={styles.emptyText} themeColor="textSecondary">
                No downloaded novels.
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView style={styles.downloadsList}>
              {downloads.map((item) => (
                <ThemedView key={item.slug} style={styles.downloadItem}>
                  <RNImage source={{ uri: getCoverUrl(item.coverUrl) }} style={styles.downloadCover} />
                  <ThemedView style={styles.downloadInfo}>
                    <ThemedText style={styles.downloadTitle}>{item.title}</ThemedText>
                    <ThemedText type="small" style={styles.downloadCount} themeColor="textSecondary">
                      {item.chaptersCount} chapters downloaded
                    </ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.downloadChScroll}>
                      {item.chapters.map((ch: any) => (
                        <TouchableOpacity
                          key={ch.sortIndex}
                          style={styles.downloadChBtn}
                          onPress={() => router.push(`/novel/${item.slug}/chapter/${ch.sortIndex}`)}
                        >
                          <ThemedText style={styles.downloadChBtnText}>Ch. {ch.sortIndex}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </ThemedView>
                </ThemedView>
              ))}
            </ThemedView>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const screenWidth = Dimensions.get('window').width;

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
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    marginTop: Spacing.six,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  exploreBtn: {
    backgroundColor: '#3c87f7',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 8,
    marginTop: Spacing.two,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  novelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
  },
  gridCard: {
    width: (screenWidth - 48) / 3, // 3 Columns
    marginBottom: Spacing.three,
  },
  gridCover: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: Spacing.one,
  },
  gridAuthor: {
    fontSize: 11,
    color: '#64748b',
  },
  recentsSection: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.five,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.three,
  },
  recentsScroll: {
    gap: Spacing.three,
    flexDirection: 'row',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 250,
    padding: Spacing.two,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    gap: Spacing.three,
  },
  recentCover: {
    width: 45,
    height: 65,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  recentMeta: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  recentChapter: {
    fontSize: 11,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    gap: Spacing.three,
  },
  tabBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tabBtnActive: {
    backgroundColor: '#3c87f7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  downloadsList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  downloadItem: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  downloadCover: {
    width: 60,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  downloadInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  downloadCount: {
    marginBottom: Spacing.two,
  },
  downloadChScroll: {
    flexDirection: 'row',
  },
  downloadChBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 16,
    marginRight: Spacing.two,
  },
  downloadChBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
