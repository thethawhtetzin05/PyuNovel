import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image as RNImage,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { API_URL } from './index';

interface Novel {
  id: number;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
  status?: string | null;
  views?: number | null;
}

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Novel[]>([]);
  const [defaultNovels, setDefaultNovels] = useState<Novel[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch initial list of novels on mount
  useEffect(() => {
    const fetchDefaultNovels = async () => {
      try {
        const response = await fetch(`${API_URL}/api/public/home`);
        const json = await response.json();
        if (json.success) {
          setDefaultNovels(json.allNovels || []);
        }
      } catch (error) {
        console.error('Error fetching default novels:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDefaultNovels();
  }, []);

  // Handle Search API calls
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(text)}`);
      const json = await response.json();
      if (json.success) {
        setSearchResults(json.results || []);
      }
    } catch (error) {
      console.error('Error searching novels:', error);
    }
  };

  const getCoverUrl = (url: string | null) => {
    if (!url) return 'https://placehold.co/150x220/png?text=No+Cover';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_URL}${url}`;
  };

  const displayedNovels = isSearching ? searchResults : defaultNovels;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Search Input Container */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Explore</ThemedText>
        <ThemedView style={[styles.searchContainer, { backgroundColor: theme.backgroundElement }]}>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search novels by title or author..."
            placeholderTextColor={theme.textSecondary || '#64748b'}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
              <ThemedText style={{ color: '#3c87f7', fontWeight: 'bold' }}>Clear</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </ThemedView>

      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3c87f7" />
        </ThemedView>
      ) : (
        <FlatList
          data={displayedNovels}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText} themeColor="textSecondary">
                No novels found matching "{searchQuery}"
              </ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.novelCard}
              activeOpacity={0.8}
              onPress={() => router.push(`/novel/${item.slug}`)}
            >
              <RNImage source={{ uri: getCoverUrl(item.coverUrl) }} style={styles.coverImage} />
              <ThemedView style={styles.infoContainer}>
                <ThemedText style={styles.novelTitle}>{item.title}</ThemedText>
                <ThemedText type="small" style={styles.novelAuthor}>By {item.author}</ThemedText>
                {item.status && (
                  <ThemedView style={styles.statusBadge}>
                    <ThemedText style={styles.statusText}>{item.status}</ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two : Spacing.one,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: 40,
  },
  clearButton: {
    paddingHorizontal: Spacing.two,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  novelCard: {
    flexDirection: 'row',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: Spacing.three,
  },
  coverImage: {
    width: 60,
    height: 85,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.one,
  },
  novelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  novelAuthor: {
    color: '#64748b',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  statusText: {
    color: '#0369a1',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    padding: Spacing.five,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
