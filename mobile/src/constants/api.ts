import Constants from 'expo-constants';

declare const __DEV__: boolean;

// Robust Dev IP detection or fallback to production URL
const getApiUrl = (): string => {
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
