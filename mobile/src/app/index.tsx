import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image as RNImage,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';

declare const __DEV__: boolean;

// Robust Dev IP detection or fallback to production URL
const getApiUrl = () => {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':').shift();
      return `http://${ip}:3000`;
    }
    return 'http://10.0.2.2:3000'; // fallback for android emulator
  }
  return 'https://pyunovel.pages.dev';
};

export const API_URL = getApiUrl();

interface Novel {
  id: number;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
  status?: string | null;
  views?: number | null;
  description?: string | null;
}

interface Chapter {
  id: number;
  title: string;
  sortIndex: number;
  createdAt: string;
  novelSlug: string;
  novelTitle: string;
  novelCoverUrl: string | null;
  novelAuthor: string;
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [spotlightNovels, setSpotlightNovels] = useState<Novel[]>([]);
  const [latestChapters, setLatestChapters] = useState<Chapter[]>([]);
  const [allNovels, setAllNovels] = useState<Novel[]>([]);

  const fetchHomeData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/public/home`);
      const json = await response.json();
      if (json.success) {
        setSpotlightNovels(json.spotlightNovels || []);
        setLatestChapters(json.latestChapters || []);
        setAllNovels(json.allNovels || []);
      }
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  // Helper to resolve cover image URL
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3c87f7" />
        }
      >
        {/* Header with PyuNovel logo style */}
        <ThemedView style={styles.header}>
          <RNImage source={{ uri: `${API_URL}/logo.png` }} style={styles.logo} />
          <ThemedView style={styles.headerTextContainer}>
            <ThemedText style={[styles.headerBrand, { color: '#3c87f7' }]}>yu</ThemedText>
            <ThemedText style={styles.headerBrand}>Novel</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* 1. Spotlight Section */}
        {spotlightNovels.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Featured Spotlight</ThemedText>
            <FlatList
              horizontal
              data={spotlightNovels}
              keyExtractor={(item: Novel) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.spotlightList}
              renderItem={({ item }: { item: Novel }) => (
                <TouchableOpacity
                  style={styles.spotlightCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/novel/${item.slug}`)}
                >
                  <RNImage source={{ uri: getCoverUrl(item.coverUrl) }} style={styles.spotlightCover} />
                  <ThemedText numberOfLines={1} style={styles.novelTitleText}>{item.title}</ThemedText>
                  <ThemedText numberOfLines={1} type="small" style={styles.novelAuthorText}>{item.author}</ThemedText>
                </TouchableOpacity>
              )}
            />
          </ThemedView>
        )}

        {/* 2. Latest Chapters Section */}
        {latestChapters.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Latest Updates</ThemedText>
            {latestChapters.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.chapterRow}
                activeOpacity={0.7}
                onPress={() => router.push(`/novel/${item.novelSlug}`)}
              >
                <RNImage source={{ uri: getCoverUrl(item.novelCoverUrl) }} style={styles.chapterCover} />
                <ThemedView style={styles.chapterInfo}>
                  <ThemedText numberOfLines={1} style={styles.chapterNovelTitle}>{item.novelTitle}</ThemedText>
                  <ThemedText numberOfLines={1} type="small" style={styles.chapterTitle}>{item.title}</ThemedText>
                </ThemedView>
                <ThemedText type="small" style={styles.chapterIndex}>Ch. {item.sortIndex}</ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        )}

        {/* 3. Explore All Section */}
        {allNovels.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Explore Novels</ThemedText>
            <ThemedView style={styles.novelsGrid}>
              {allNovels.map((item) => (
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
          </ThemedView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: 2,
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBrand: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  section: {
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: Spacing.three,
  },
  spotlightList: {
    gap: Spacing.three,
  },
  spotlightCard: {
    width: 110,
  },
  spotlightCover: {
    width: 110,
    height: 160,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  novelTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: Spacing.one,
  },
  novelAuthorText: {
    fontSize: 12,
    color: '#64748b',
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: Spacing.three,
  },
  chapterCover: {
    width: 40,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  chapterInfo: {
    flex: 1,
    gap: 2,
  },
  chapterNovelTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  chapterTitle: {
    fontSize: 13,
    color: '#64748b',
  },
  chapterIndex: {
    color: '#3c87f7',
    fontWeight: '600',
  },
  novelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    justifyContent: 'space-between',
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
});
