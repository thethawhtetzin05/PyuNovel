import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image as RNImage,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { API_URL } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';

interface Novel {
  id: number;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
  status?: string | null;
  views?: number | null;
  tags?: string[] | string | null;
}

const STATUS_OPTIONS = ['all', 'ongoing', 'completed', 'hiatus'];
const SORT_OPTIONS = [
  { label: 'Latest', value: 'latest' },
  { label: 'Popular', value: 'popular' },
];
const POPULAR_TAGS = ['Action', 'Romance', 'Fantasy', 'Martial Arts', 'System', 'Drama', 'Sci-Fi', 'Slice of Life'];

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'latest' | 'popular'>('latest');

  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFilterSearching, setIsFilterSearching] = useState(false);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [defaultNovels, setDefaultNovels] = useState<Novel[]>([]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch initial default novels on mount
  useEffect(() => {
    const fetchDefaultNovels = async () => {
      try {
        const response = await fetch(`${API_URL}/api/public/home`);
        const json = await response.json();
        if (json.success) {
          setDefaultNovels(json.allNovels || []);
          setNovels(json.allNovels || []);
        }
      } catch (error) {
        console.error('Error fetching default novels:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDefaultNovels();
  }, []);

  // Main search / filter execution function
  const runFilterQuery = useCallback(async (q: string, status: string, tag: string, sort: string) => {
    const isDefaultState = !q.trim() && status === 'all' && tag === 'all' && sort === 'latest';
    
    if (isDefaultState) {
      setIsFilterSearching(false);
      setNovels(defaultNovels);
      return;
    }

    setIsFilterSearching(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.append('q', q.trim());
      if (status !== 'all') params.append('status', status);
      if (tag !== 'all') params.append('tag', tag);
      if (sort !== 'latest') params.append('sort', sort);

      const response = await fetch(`${API_URL}/api/search?${params.toString()}`);
      const json = await response.json();
      if (json.success) {
        setNovels(json.results || []);
      }
    } catch (error) {
      console.error('Error filtering novels:', error);
    }
  }, [defaultNovels]);

  // Trigger filter query whenever filters or search query changes with debounce
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      runFilterQuery(searchQuery, selectedStatus, selectedTag, sortOption);
    }, 350);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery, selectedStatus, selectedTag, sortOption, runFilterQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedTag('all');
    setSortOption('latest');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedStatus !== 'all' || selectedTag !== 'all' || sortOption !== 'latest';

  const getCoverUrl = (url: string | null) => {
    if (!url) return 'https://placehold.co/150x220/png?text=No+Cover';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_URL}${url}`;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerTop}>
          <ThemedText style={styles.headerTitle}>Explore</ThemedText>
          <TouchableOpacity
            style={[styles.filterToggleBtn, hasActiveFilters && styles.filterToggleBtnActive]}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.filterToggleBtnText, hasActiveFilters && styles.filterToggleBtnTextActive]}>
              🎛️ Filter {hasActiveFilters ? '•' : ''}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Search Bar */}
        <ThemedView style={[styles.searchContainer, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search titles, authors, keywords..."
            placeholderTextColor={theme.textSecondary || '#64748b'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <ThemedText style={styles.clearButtonText}>✕</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </ThemedView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={[styles.dropdownSheet, { backgroundColor: theme.background }]}>
            
            <ThemedView style={styles.bottomSheetHeader}>
              <ThemedText style={styles.bottomSheetTitle}>Filters & Sort</ThemedText>
              <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.doneBtn}>
                <ThemedText style={styles.doneBtnText}>Done</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {/* Status Filter */}
            <ThemedView style={styles.filterGroup}>
              <ThemedText type="smallBold" style={styles.filterGroupTitle}>Status</ThemedText>
              <ThemedView style={styles.chipRow}>
                {STATUS_OPTIONS.map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.chip, selectedStatus === st && styles.chipActive]}
                    onPress={() => setSelectedStatus(st)}
                  >
                    <ThemedText style={[styles.chipText, selectedStatus === st && styles.chipTextActive]}>
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </ThemedView>

            {/* Sort Filter */}
            <ThemedView style={styles.filterGroup}>
              <ThemedText type="smallBold" style={styles.filterGroupTitle}>Sort By</ThemedText>
              <ThemedView style={styles.chipRow}>
                {SORT_OPTIONS.map((so) => (
                  <TouchableOpacity
                    key={so.value}
                    style={[styles.chip, sortOption === so.value && styles.chipActive]}
                    onPress={() => setSortOption(so.value as 'latest' | 'popular')}
                  >
                    <ThemedText style={[styles.chipText, sortOption === so.value && styles.chipTextActive]}>
                      {so.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </ThemedView>

            {/* Tags Filter */}
            <ThemedView style={styles.filterGroup}>
              <ThemedText type="smallBold" style={styles.filterGroupTitle}>Genre / Tag</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                <TouchableOpacity
                  style={[styles.chip, selectedTag === 'all' && styles.chipActive]}
                  onPress={() => setSelectedTag('all')}
                >
                  <ThemedText style={[styles.chipText, selectedTag === 'all' && styles.chipTextActive]}>
                    All
                  </ThemedText>
                </TouchableOpacity>
                {POPULAR_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.chip, selectedTag === tag && styles.chipActive]}
                    onPress={() => setSelectedTag(tag)}
                  >
                    <ThemedText style={[styles.chipText, selectedTag === tag && styles.chipTextActive]}>
                      {tag}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ThemedView>

            {/* Reset Button */}
            {hasActiveFilters && (
              <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
                <ThemedText style={styles.resetBtnText}>Clear All Filters</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setShowFilters(false)} />
        </ThemedView>
      </Modal>

      {/* Main Novel List */}
      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3c87f7" />
        </ThemedView>
      ) : (
        <FlatList
          data={novels}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={56} color={theme.textSecondary || "#94a3b8"} />
              <ThemedText style={styles.emptyText} themeColor="textSecondary">
                {hasActiveFilters
                  ? 'No novels match your selected filters.'
                  : 'No novels found.'}
              </ThemedText>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.resetBtnEmpty} onPress={handleResetFilters}>
                  <ThemedText style={styles.resetBtnText}>Clear Filters</ThemedText>
                </TouchableOpacity>
              )}
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
                
                <ThemedView style={styles.metaRow}>
                  {item.status && (
                    <ThemedView style={styles.statusBadge}>
                      <ThemedText style={styles.statusText}>{item.status}</ThemedText>
                    </ThemedView>
                  )}
                  {item.views !== undefined && item.views !== null && (
                    <ThemedText type="small" style={styles.viewsText}>
                      👁️ {item.views} views
                    </ThemedText>
                  )}
                </ThemedView>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterToggleBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterToggleBtnActive: {
    backgroundColor: '#3c87f7',
  },
  filterToggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterToggleBtnTextActive: {
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two : Spacing.one,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: 40,
  },
  clearButton: {
    paddingHorizontal: Spacing.two,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  filterAccordion: {
    padding: Spacing.three,
    borderRadius: 10,
    marginTop: Spacing.two,
    gap: Spacing.three,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  modalDismiss: {
    flex: 1,
  },
  dropdownSheet: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 50 : Spacing.four,
    gap: Spacing.four,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  doneBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  doneBtnText: {
    fontSize: 16,
    color: '#3c87f7',
    fontWeight: 'bold',
  },
  filterGroup: {
    gap: Spacing.one,
  },
  filterGroupTitle: {
    fontSize: 12,
    color: '#64748b',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chipScroll: {
    gap: Spacing.two,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  chipActive: {
    backgroundColor: '#3c87f7',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  resetBtn: {
    alignSelf: 'center',
    marginTop: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  resetBtnEmpty: {
    backgroundColor: '#3c87f7',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 8,
    marginTop: Spacing.two,
  },
  resetBtnText: {
    color: '#3c87f7',
    fontWeight: 'bold',
    fontSize: 13,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: '#0369a1',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  viewsText: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
});
