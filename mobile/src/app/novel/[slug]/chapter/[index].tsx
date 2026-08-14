import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { API_URL } from '../../../index';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChapterDetail {
  id: number;
  title: string;
  content: string;
  sortIndex: number;
}

interface NovelMeta {
  id: number;
  title: string;
  slug: string;
  chapterPrice: number;
}

interface NavIndex {
  sortIndex: number;
}

export default function ReaderScreen() {
  const { slug, index } = useLocalSearchParams<{ slug: string; index: string }>();
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [novel, setNovel] = useState<NovelMeta | null>(null);
  const [prevChapter, setPrevChapter] = useState<NavIndex | null>(null);
  const [nextChapter, setNextChapter] = useState<NavIndex | null>(null);

  // Settings
  const [fontSize, setFontSize] = useState<number>(18);
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSize = await AsyncStorage.getItem('pyunovel_reader_fontsize');
        if (savedSize) {
          setFontSize(parseInt(savedSize, 10));
        }
        const savedTheme = await AsyncStorage.getItem('pyunovel_reader_theme');
        if (savedTheme) {
          setReaderTheme(savedTheme as 'light' | 'sepia' | 'dark');
        }
      } catch (error) {
        console.error('Error loading reader settings:', error);
      }
    };
    loadSettings();
  }, []);

  const updateFontSize = async (size: number) => {
    setFontSize(size);
    try {
      await AsyncStorage.setItem('pyunovel_reader_fontsize', size.toString());
    } catch (error) {
      console.error('Error saving font size:', error);
    }
  };

  const updateReaderTheme = async (theme: 'light' | 'sepia' | 'dark') => {
    setReaderTheme(theme);
    try {
      await AsyncStorage.setItem('pyunovel_reader_theme', theme);
    } catch (error) {
      console.error('Error saving reader theme:', error);
    }
  };

  useEffect(() => {
    const fetchChapter = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/public/novel/${slug}/chapter/${index}`);
        const json = await response.json();
        if (json.success && json.data) {
          setChapter(json.data.chapter);
          setNovel(json.data.novel);
          setPrevChapter(json.data.prev);
          setNextChapter(json.data.next);
        }
      } catch (error) {
        console.error("Error fetching chapter:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug && index) {
      fetchChapter();
    }
  }, [slug, index]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3c87f7" />
      </ThemedView>
    );
  }

  if (!chapter || !novel) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>Chapter not found</ThemedText>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Get reader colors based on theme choice
  const getThemeColors = () => {
    switch (readerTheme) {
      case 'sepia':
        return { background: '#f4ecd8', text: '#5c4033', card: '#eae0c8' };
      case 'dark':
        return { background: '#121212', text: '#e0e0e0', card: '#1e1e1e' };
      default:
        return { background: '#ffffff', text: '#2d3748', card: '#f7fafc' };
    }
  };

  const colors = getThemeColors();

  // Helper to strip HTML tags from content
  const cleanContent = (htmlContent: string) => {
    if (!htmlContent) return '';
    return htmlContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '') // remove remaining tags
      .trim();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <ThemedView style={[styles.navHeader, { backgroundColor: colors.background, borderBottomColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={{ color: '#3c87f7', fontWeight: 'bold' }}>← Exit</ThemedText>
        </TouchableOpacity>
        <ThemedText numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>{novel.title}</ThemedText>
        <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
          <ThemedText style={{ color: '#3c87f7', fontWeight: 'bold' }}>⚙️ Style</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Floating Settings Panel */}
      {showSettings && (
        <ThemedView style={[styles.settingsPanel, { backgroundColor: colors.card }]}>
          {/* Font Sizes */}
          <ThemedView style={styles.settingRow}>
            <ThemedText style={{ color: colors.text }}>Font Size:</ThemedText>
            <ThemedView style={styles.buttonGroup}>
              <TouchableOpacity style={styles.settingBtn} onPress={() => updateFontSize(Math.max(14, fontSize - 2))}>
                <ThemedText style={styles.settingBtnText}>A-</ThemedText>
              </TouchableOpacity>
              <ThemedText style={[styles.fontSizeDisplay, { color: colors.text }]}>{fontSize}</ThemedText>
              <TouchableOpacity style={styles.settingBtn} onPress={() => updateFontSize(Math.min(26, fontSize + 2))}>
                <ThemedText style={styles.settingBtnText}>A+</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          {/* Background Themes */}
          <ThemedView style={{ height: Spacing.two }} />
          <ThemedView style={styles.settingRow}>
            <ThemedText style={{ color: colors.text }}>Theme:</ThemedText>
            <ThemedView style={styles.buttonGroup}>
              <TouchableOpacity style={[styles.themeBtn, { backgroundColor: '#ffffff' }]} onPress={() => updateReaderTheme('light')}>
                <ThemedText style={{ color: '#000', fontSize: 11 }}>Light</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.themeBtn, { backgroundColor: '#f4ecd8' }]} onPress={() => updateReaderTheme('sepia')}>
                <ThemedText style={{ color: '#5c4033', fontSize: 11 }}>Sepia</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.themeBtn, { backgroundColor: '#121212' }]} onPress={() => updateReaderTheme('dark')}>
                <ThemedText style={{ color: '#fff', fontSize: 11 }}>Dark</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}

      {/* Scrollable Reading Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={[styles.chapterTitleText, { color: colors.text }]}>{chapter.title}</ThemedText>
        
        <ThemedText style={[styles.contentText, { color: colors.text, fontSize, lineHeight: fontSize * 1.6 }]}>
          {cleanContent(chapter.content)}
        </ThemedText>

        {/* Page Nav Buttons */}
        <ThemedView style={styles.navRow}>
          {prevChapter ? (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => router.replace(`/novel/${slug}/chapter/${prevChapter.sortIndex}`)}
            >
              <ThemedText style={styles.navBtnText}>← Previous</ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedView style={[styles.navBtn, styles.disabledBtn]}>
              <ThemedText style={styles.disabledBtnText}>First Chapter</ThemedText>
            </ThemedView>
          )}

          {nextChapter ? (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => router.replace(`/novel/${slug}/chapter/${nextChapter.sortIndex}`)}
            >
              <ThemedText style={styles.navBtnText}>Next →</ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedView style={[styles.navBtn, styles.disabledBtn]}>
              <ThemedText style={styles.disabledBtnText}>Last Chapter</ThemedText>
            </ThemedView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    maxWidth: Dimensions.get('window').width * 0.5,
  },
  settingsPanel: {
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  settingBtn: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 6,
  },
  settingBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  fontSizeDisplay: {
    fontSize: 15,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  themeBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
  },
  chapterTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: Spacing.four,
  },
  contentText: {
    fontWeight: '500',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.five,
    gap: Spacing.three,
  },
  navBtn: {
    flex: 1,
    backgroundColor: '#3c87f7',
    paddingVertical: Spacing.three,
    borderRadius: 8,
    alignItems: 'center',
  },
  navBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  disabledBtn: {
    backgroundColor: '#e2e8f0',
  },
  disabledBtnText: {
    color: '#94a3b8',
    fontWeight: 'bold',
  },
});
