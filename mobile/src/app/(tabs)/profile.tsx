import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { API_URL } from '@/constants/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  coins?: number;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  // Authentication State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [topupLoading, setTopupLoading] = useState(false);

  const handleTopUp = async () => {
    if (!token) return;
    setTopupLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/add-coins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await response.json();
      if (json.success) {
        alert('Simulated top-up of 500 coins successful!');
        const updatedUser = { ...user!, coins: json.coins };
        setUser(updatedUser);
        await AsyncStorage.setItem('pyunovel_user_data', JSON.stringify(updatedUser));
      } else {
        alert(json.error || 'Failed to simulate top-up');
      }
    } catch (error) {
      console.error('Top-up error:', error);
      alert('Network error while simulating top-up.');
    } finally {
      setTopupLoading(false);
    }
  };

  const loadSession = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('pyunovel_session_token');
      const savedUser = await AsyncStorage.getItem('pyunovel_user_data');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSession();
    });
    loadSession();
    return unsubscribe;
  }, [navigation]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setErrorMsg(null);
    setFormLoading(true);

    const endpoint = isLogin ? '/api/auth/sign-in/email' : '/api/auth/sign-up/email';
    const payload = isLogin 
      ? { email: email.trim(), password }
      : { email: email.trim(), password, name: name.trim() };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok || (json.error && !json.user)) {
        setErrorMsg(json.message || json.error?.message || 'Authentication failed');
        return;
      }

      const sessionToken = json.token || json.session?.token || json.session?.id;
      const userData = json.user;

      if (userData) {
        // Save to storage
        await AsyncStorage.setItem('pyunovel_user_data', JSON.stringify(userData));
        if (sessionToken) {
          await AsyncStorage.setItem('pyunovel_session_token', sessionToken);
          setToken(sessionToken);
        }
        setUser(userData);
        
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
      } else {
        setErrorMsg('Authentication failed: No user data returned');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // Opt-out from backend session (fire-and-forget or try)
      if (token) {
        await fetch(`${API_URL}/api/auth/sign-out`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {});
      }
      
      await AsyncStorage.removeItem('pyunovel_session_token');
      await AsyncStorage.removeItem('pyunovel_user_data');
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
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
        
        {user ? (
          // PROFILE STATE
          <ThemedView style={styles.profileContainer}>
            <ThemedView style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </ThemedText>
            </ThemedView>

            <ThemedText style={styles.profileName}>{user.name}</ThemedText>
            <ThemedText style={styles.profileEmail} themeColor="textSecondary">{user.email}</ThemedText>

            <ThemedView style={styles.infoSection}>
              <ThemedView style={[styles.infoCard, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small" themeColor="textSecondary">Account Type</ThemedText>
                <ThemedText style={styles.infoValue}>{user.role || 'Reader'}</ThemedText>
              </ThemedView>
              
              <ThemedView style={[styles.infoCard, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small" themeColor="textSecondary">Coins Available</ThemedText>
                <ThemedText style={styles.infoValue}>🪙 {user.coins ?? 0}</ThemedText>
              </ThemedView>
            </ThemedView>

            <TouchableOpacity 
              style={[styles.topupBtn, { backgroundColor: '#3c87f7' }]} 
              onPress={handleTopUp}
              disabled={topupLoading}
            >
              {topupLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.topupText}>Simulate Top Up (🪙 +500 Coins)</ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          // AUTH STATE (LOGIN / SIGN UP)
          <ThemedView style={styles.authContainer}>
            <ThemedText style={styles.authTitle}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </ThemedText>
            <ThemedText style={styles.authSubtitle} themeColor="textSecondary">
              {isLogin ? 'Sign in to access your library and coins' : 'Register to get started with PyuNovel'}
            </ThemedText>

            {errorMsg && (
              <ThemedView style={styles.errorBox}>
                <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
              </ThemedView>
            )}

            <ThemedView style={styles.form}>
              {!isLogin && (
                <ThemedView style={styles.inputGroup}>
                  <ThemedText type="small" style={styles.label}>Full Name</ThemedText>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundElement, backgroundColor: theme.backgroundElement }]}
                    placeholder="Enter your name"
                    placeholderTextColor={theme.textSecondary || '#64748b'}
                    value={name}
                    onChangeText={setName}
                  />
                </ThemedView>
              )}

              <ThemedView style={styles.inputGroup}>
                <ThemedText type="small" style={styles.label}>Email Address</ThemedText>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundElement, backgroundColor: theme.backgroundElement }]}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.textSecondary || '#64748b'}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </ThemedView>

              <ThemedView style={styles.inputGroup}>
                <ThemedText type="small" style={styles.label}>Password</ThemedText>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundElement, backgroundColor: theme.backgroundElement }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary || '#64748b'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </ThemedView>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleAuth}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.submitBtnText}>
                    {isLogin ? 'Sign In' : 'Register'}
                  </ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.switchBtn} 
                onPress={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg(null);
                }}
              >
                <ThemedText style={styles.switchText}>
                  {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        )}

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
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  profileContainer: {
    alignItems: 'center',
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3c87f7',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: Spacing.five,
  },
  infoSection: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.six,
  },
  infoCard: {
    flex: 1,
    padding: Spacing.four,
    borderRadius: 12,
    alignItems: 'center',
    gap: Spacing.one,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  signOutBtn: {
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  signOutText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  authContainer: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.six,
  },
  authTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.five,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginBottom: Spacing.four,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    gap: Spacing.four,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  label: {
    fontWeight: '600',
    marginBottom: 2,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#3c87f7',
    paddingVertical: Spacing.three,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.two,
    height: 48,
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchBtn: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  switchText: {
    color: '#3c87f7',
    fontWeight: '600',
    fontSize: 13,
  },
  topupBtn: {
    paddingVertical: Spacing.three,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  topupText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
