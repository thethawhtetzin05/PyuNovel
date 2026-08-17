import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, Image as RNImage, TouchableOpacity, FlatList, Modal, TextInput, View, useWindowDimensions } from 'react-native';
import { TabView } from 'react-native-tab-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { API_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

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
  isPaid?: boolean | number;
  isUnlocked?: boolean;
}

interface ReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
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
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [myReview, setMyReview] = useState<ReviewItem | null>(null);
  const [lastRead, setLastRead] = useState<{ chapterIndex: number; chapterTitle: string } | null>(null);

  // Review Modal state
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [showAllReviews, setShowAllReviews] = useState<boolean>(false);
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'synopsis', title: 'Synopsis' },
    { key: 'chapters', title: 'Chapters' },
    { key: 'reviews', title: 'Reviews' },
  ]);

  // Load bookmark status on mount / slug change
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!slug) return;
      try {
        const [bookmarksStr, recentsStr] = await Promise.all([
          AsyncStorage.getItem('pyunovel_bookmarks'),
          AsyncStorage.getItem('pyunovel_recents')
        ]);
        if (bookmarksStr) {
          const bookmarks = JSON.parse(bookmarksStr);
          const exists = bookmarks.some((b: any) => b.slug === slug);
          setIsBookmarked(exists);
        }
        if (recentsStr) {
          const recents = JSON.parse(recentsStr);
          const found = recents.find((r: any) => r.novelSlug === slug);
          if (found) {
            setLastRead({ chapterIndex: found.chapterIndex, chapterTitle: found.chapterTitle });
          }
        }
      } catch (error) {
        console.error('Error checking bookmark/recents status:', error);
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

  const downloadNovel = async () => {
    if (!novel || !slug) return;
    setDownloading(true);
    setDownloadProgress(0);
    try {
      const res = await fetch(`${API_URL}/api/public/novel/${slug}/chapters?limit=500`);
      const json = await res.json();
      if (!json.success || !json.chapters) {
        alert('Failed to get chapter list for download');
        setDownloading(false);
        return;
      }

      const allChapters = json.chapters;
      const total = allChapters.length;
      if (total === 0) {
        alert('No chapters available to download');
        setDownloading(false);
        return;
      }

      const token = await AsyncStorage.getItem('pyunovel_session_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let downloadedCount = 0;
      const downloadedChsList: { sortIndex: number; title: string }[] = [];

      for (let i = 0; i < total; i++) {
        const ch = allChapters[i];
        try {
          const chRes = await fetch(`${API_URL}/api/public/novel/${slug}/chapter/${ch.sortIndex}`, {
            headers
          });
          const chJson = await chRes.json();
          if (chJson.success && chJson.data && !chJson.data.isLocked) {
            await AsyncStorage.setItem(
              `pyunovel_download_chapter_${slug}_${ch.sortIndex}`, 
              JSON.stringify(chJson.data)
            );
            downloadedChsList.push({
              sortIndex: ch.sortIndex,
              title: ch.title
            });
            downloadedCount++;
          }
        } catch (e) {
          console.error(`Failed to download chapter ${ch.sortIndex}:`, e);
        }
        
        setDownloadProgress(Math.round(((i + 1) / total) * 100));
      }

      if (downloadedCount > 0) {
        const catalogStr = await AsyncStorage.getItem('pyunovel_download_catalog');
        let catalog = catalogStr ? JSON.parse(catalogStr) : [];

        catalog = catalog.filter((n: any) => n.slug !== slug);

        catalog.push({
          id: novel.id,
          title: novel.title,
          slug: novel.slug,
          author: novel.author,
          coverUrl: novel.coverUrl,
          chaptersCount: downloadedCount,
          chapters: downloadedChsList,
          downloadedAt: Date.now()
        });

        await AsyncStorage.setItem('pyunovel_download_catalog', JSON.stringify(catalog));
        alert(`Downloaded ${downloadedCount} free/unlocked chapters successfully!`);
      } else {
        alert('No free or unlocked chapters could be downloaded.');
      }

    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download chapters due to a network error.');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleLoadMoreChapters = async () => {
    if (loadingMoreChapters || !slug) return;
    try {
      setLoadingMoreChapters(true);
      const offset = chapters.length;
      const savedToken = await AsyncStorage.getItem('pyunovel_session_token');
      const headers: Record<string, string> = {};
      if (savedToken) {
        headers['Authorization'] = `Bearer ${savedToken}`;
      }
      const res = await fetch(`${API_URL}/api/public/novel/${slug}/chapters?offset=${offset}&limit=50`, {
        headers
      });
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
        const savedToken = await AsyncStorage.getItem('pyunovel_session_token');
        const headers: Record<string, string> = {};
        if (savedToken) {
          headers['Authorization'] = `Bearer ${savedToken}`;
        }
        const response = await fetch(`${API_URL}/api/public/novel/${slug}`, {
          headers
        });
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

    fetchReviews();
    if (slug) {
      fetchNovelDetails();
    }
  }, [slug]);

  const fetchReviews = async () => {
    if (!slug) return;
    try {
      const res = await fetch(`${API_URL}/api/public/novel/${slug}/reviews`);
      const json = await res.json();
      if (json.success) {
        setReviews(json.reviews || []);
        setAvgRating(json.avgRating || 0);
        setTotalReviews(json.totalReviews || 0);

        const userDataStr = await AsyncStorage.getItem('pyunovel_user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const found = (json.reviews || []).find((r: ReviewItem) => r.user.id === userData.id);
          if (found) {
            setMyReview(found);
            setUserRating(found.rating);
            setReviewComment(found.comment || '');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleOpenReviewModal = async () => {
    const token = await AsyncStorage.getItem('pyunovel_session_token');
    if (!token) {
      alert('Please login to write a review.');
      router.push('/profile');
      return;
    }
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!novel || !slug) return;
    if (userRating < 1 || userRating > 5) {
      alert('Please select a rating between 1 and 5 stars.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('pyunovel_session_token');
      if (!token) {
        alert('Please login to write a review.');
        router.push('/profile');
        return;
      }

      setSubmittingReview(true);
      const res = await fetch(`${API_URL}/api/novel/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          novelId: novel.id,
          novelSlug: slug,
          rating: userRating,
          comment: reviewComment
        })
      });

      const json = await res.json();
      if (json.success) {
        alert(myReview ? 'Review updated successfully!' : 'Review submitted successfully!');
        setShowReviewModal(false);
        fetchReviews();
      } else {
        alert(json.error || 'Failed to submit review.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Network error while submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

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

  // Safely parse tags helper (supporting JSON array or comma-separated string)
  const parsedTags: string[] = (() => {
    if (!novel.tags) return [];
    if (Array.isArray(novel.tags)) return novel.tags;
    if (typeof novel.tags === 'string') {
      try {
        const parsed = JSON.parse(novel.tags);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Not a JSON array, treat as comma-separated string
      }
      return novel.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
    }
    return [];
  })();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={{ flex: 1 }}>
        {/* Back navigation header */}
        <TouchableOpacity style={styles.navHeader} onPress={() => router.back()}>
          <ThemedText style={styles.navBackText}>{"< Back"}</ThemedText>
        </TouchableOpacity>

        {/* Novel Hero Card */}
        <ThemedView style={styles.heroCard}>
          <RNImage source={{ uri: getCoverUrl(novel.coverUrl) }} style={styles.coverImage} />
          <ThemedView style={styles.metaContainer}>
            <ThemedText style={styles.titleText}>{novel.title}</ThemedText>
            <ThemedText type="small" style={styles.authorText}>By {novel.author}</ThemedText>
            
            <ThemedView style={styles.ratingRow}>
              <ThemedText style={styles.ratingStarsText}>⭐ {avgRating > 0 ? avgRating.toFixed(1) : 'No ratings'}</ThemedText>
              {totalReviews > 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                </ThemedText>
              )}
            </ThemedView>
            
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

            {/* Start / Continue Reading Button */}
            {chapters.length > 0 && (
              <TouchableOpacity
                style={styles.readNowBtn}
                onPress={() => {
                  const targetIndex = lastRead?.chapterIndex || chapters[0]?.sortIndex || 1;
                  router.push(`/novel/${slug}/chapter/${targetIndex}`);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="play-circle" size={18} color="#ffffff" />
                <ThemedText style={styles.readNowBtnText}>
                  {lastRead ? `Continue Ch. ${lastRead.chapterIndex}` : 'Start Reading'}
                </ThemedText>
              </TouchableOpacity>
            )}

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={[
                  styles.actionBtn, 
                  isBookmarked ? styles.actionBtnSelected : styles.actionBtnOutline
                ]} 
                onPress={toggleBookmark}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons 
                  name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                  size={18} 
                  color={isBookmarked ? "#ffffff" : "#3c87f7"} 
                />
                <ThemedText style={isBookmarked ? styles.actionBtnTextSelected : styles.actionBtnTextOutline}>
                  {isBookmarked ? 'In Library' : 'Library'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, styles.actionBtnPrimary]} 
                onPress={downloadNovel}
                disabled={downloading}
                activeOpacity={0.8}
              >
                {downloading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="cloud-download-outline" size={18} color="#ffffff" />
                    <ThemedText style={styles.actionBtnTextPrimary}>
                      {downloadProgress > 0 ? `${downloadProgress}%` : 'Download'}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
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

        <TabView
          navigationState={{ index, routes }}
          renderScene={({ route }) => {
            switch (route.key) {
              case 'synopsis':
                return (
                  <ScrollView contentContainerStyle={styles.tabScrollContent}>
                    <ThemedView style={styles.synopsisContainer}>
                      <ThemedText type="small" style={styles.descriptionText}>
                        {novel.description || 'No description available.'}
                      </ThemedText>
                    </ThemedView>
                  </ScrollView>
                );
              case 'reviews':
                return (
                  <ScrollView contentContainerStyle={styles.tabScrollContent}>
                    <ThemedView style={styles.reviewsContainer}>
                      <ThemedView style={styles.reviewsHeaderRow}>
                        <ThemedText type="smallBold" style={styles.sectionHeader}>
                          User Reviews ({totalReviews})
                        </ThemedText>
                        <TouchableOpacity style={styles.writeReviewBtn} onPress={handleOpenReviewModal}>
                          <ThemedText style={styles.writeReviewBtnText}>
                            {myReview ? '✏️ Edit Review' : '⭐ Write Review'}
                          </ThemedText>
                        </TouchableOpacity>
                      </ThemedView>

                      {reviews.length === 0 ? (
                        <ThemedText type="small" style={styles.noChaptersText}>
                          No reviews yet. Be the first to leave a review!
                        </ThemedText>
                      ) : (
                        (showAllReviews ? reviews : reviews.slice(0, 3)).map((rev) => (
                          <ThemedView key={rev.id} style={styles.reviewCard}>
                            <ThemedView style={styles.reviewCardHeader}>
                              <ThemedText style={styles.reviewerName}>{rev.user.name}</ThemedText>
                              <ThemedText style={styles.starText}>{"⭐".repeat(rev.rating)}</ThemedText>
                            </ThemedView>
                            {rev.comment && (
                              <ThemedText type="small" style={styles.reviewCommentText}>
                                {rev.comment}
                              </ThemedText>
                            )}
                            <ThemedText type="small" style={styles.reviewDate} themeColor="textSecondary">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </ThemedText>
                          </ThemedView>
                        ))
                      )}

                      {reviews.length > 3 && !showAllReviews && (
                        <TouchableOpacity style={styles.showMoreReviewsBtn} onPress={() => setShowAllReviews(true)}>
                          <ThemedText style={styles.showMoreReviewsText}>
                            Show all {totalReviews} reviews ↓
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </ThemedView>
                  </ScrollView>
                );
              case 'chapters':
                return (
                  <ScrollView contentContainerStyle={styles.tabScrollContent}>
                    <ThemedView style={styles.chaptersContainer}>
                      {chapters.length === 0 ? (
                        <ThemedText type="small" style={styles.noChaptersText}>No chapters published yet.</ThemedText>
                      ) : (
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
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    {Boolean(ch.isPaid) && !ch.isUnlocked && (
                                      <Ionicons name="lock-closed" size={14} color="#94a3b8" style={{ marginRight: 2 }} />
                                    )}
                                    <Ionicons name="chevron-forward" size={18} color="#3c87f7" />
                                  </View>
                                </TouchableOpacity>
                              ))}
                            </ThemedView>
                          );
                        })
                      )}

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
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                {Boolean(ch.isPaid) && !ch.isUnlocked && (
                                  <Ionicons name="lock-closed" size={14} color="#94a3b8" style={{ marginRight: 2 }} />
                                )}
                                <Ionicons name="chevron-forward" size={18} color="#3c87f7" />
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ThemedView>
                      )}

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
                );
              default:
                return null;
            }
          }}
          renderTabBar={(props) => (
            <ThemedView style={styles.detailTabsContainer}>
              {props.navigationState.routes.map((route: any, i: number) => {
                const isActive = index === i;
                const tab = route.key;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.detailTabBtn, isActive && styles.detailTabBtnActive]}
                    onPress={() => setIndex(i)}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={[styles.detailTabText, isActive && styles.detailTabTextActive]}>
                      {route.title}
                    </ThemedText>
                    {tab !== 'synopsis' && (
                      <ThemedView style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                        <ThemedText style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                          {tab === 'chapters' ? totalChapters : totalReviews}
                        </ThemedText>
                      </ThemedView>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ThemedView>
          )}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
        />
      </View>

      {/* Write / Edit Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.modalTitle}>
              {myReview ? 'Edit Your Review' : 'Write a Review'}
            </ThemedText>

            <ThemedText style={styles.modalSubtitle}>Rate this novel:</ThemedText>
            <ThemedView style={styles.starPickerRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                  <ThemedText style={{ fontSize: 32 }}>
                    {star <= userRating ? '⭐' : '☆'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>

            <TextInput
              style={[styles.modalTextInput, { color: theme.text }]}
              placeholder="Write your review or thoughts here..."
              placeholderTextColor={theme.textSecondary || '#64748b'}
              multiline
              numberOfLines={4}
              value={reviewComment}
              onChangeText={setReviewComment}
              maxLength={500}
            />

            <ThemedView style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowReviewModal(false)}
              >
                <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.modalSubmitText}>Submit</ThemedText>
                )}
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
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
  tabScrollContent: {
    flexGrow: 1,
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
  detailTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 4,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.five,
    alignItems: 'center',
    gap: 4,
  },
  detailTabBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  detailTabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailTabText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  detailTabTextActive: {
    color: '#3c87f7',
  },
  tabBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: '#eff6ff',
  },
  tabBadgeText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
  },
  tabBadgeTextActive: {
    color: '#3c87f7',
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
  readNowBtn: {
    backgroundColor: '#3c87f7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: Spacing.two,
    shadowColor: '#3c87f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  readNowBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionBtnOutline: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3c87f7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionBtnSelected: {
    backgroundColor: '#3c87f7',
    borderWidth: 1,
    borderColor: '#3c87f7',
    shadowColor: '#3c87f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnPrimary: {
    backgroundColor: '#3c87f7',
    borderWidth: 1,
    borderColor: '#3c87f7',
    shadowColor: '#3c87f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnTextOutline: {
    color: '#3c87f7',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnTextSelected: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnTextPrimary: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: 2,
  },
  ratingStarsText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  reviewsContainer: {
    marginTop: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  writeReviewBtn: {
    backgroundColor: '#3c87f7',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 6,
  },
  writeReviewBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewCard: {
    padding: Spacing.three,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    marginBottom: Spacing.three,
    gap: 4,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  starText: {
    fontSize: 12,
  },
  reviewCommentText: {
    fontSize: 13,
    color: '#475569',
    marginVertical: 2,
  },
  reviewDate: {
    fontSize: 11,
  },
  showMoreReviewsBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
  },
  showMoreReviewsText: {
    color: '#3c87f7',
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: Spacing.three,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  modalCancelBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 6,
  },
  modalCancelText: {
    color: '#64748b',
    fontWeight: '600',
  },
  modalSubmitBtn: {
    backgroundColor: '#3c87f7',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.six,
    borderRadius: 6,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
