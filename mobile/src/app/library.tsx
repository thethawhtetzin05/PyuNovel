import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  Image as RNImage,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
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

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<BookmarkedNovel[]>([]);

  const fetchBookmarks = async () => {
    try {
      const bookmarksStr = await AsyncStorage.getItem('pyunovel_bookmarks');
      if (bookmarksStr) {
        setBookmarks(JSON.parse(bookmarksStr));
      } else {
        setBookmarks([]);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookmarks whenever the screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchBookmarks();
    });
    fetchBookmarks();
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
          <ThemedText type="small" themeColor="textSecondary">
            Your bookmarked novels ({bookmarks.length})
          </ThemedText>
        </ThemedView>

        {bookmarks.length === 0 ? (
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
});
