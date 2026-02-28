import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    // App ရဲ့ unique identifier (Play Store မှာ သုံးမယ်)
    appId: 'com.pyunovel.app',
    appName: 'PyuNovel',

    // Capacitor က built web files ယူမယ့် folder
    // next build → out/ folder (static export)
    // Live server approach: server.url သုံးမယ်
    webDir: 'out',

    server: {
        // Development မှာ local server ကို point
        // Production မှာ ဒါကို ဖြုတ်ပြီး static files သုံးမယ်
        url: 'https://pyunovel.pages.dev',

        // Android app ထဲမှာ cleartext (http) ခွင့်ပြုမယ်
        androidScheme: 'https',
        allowNavigation: ['pyunovel.pages.dev', 'pyunovel.com', '*.r2.dev', '*.cloudflare.com'],
    },

    android: {
        // Android build settings
        buildOptions: {
            keystorePath: undefined,    // Release build အတွက် keystore path
            keystorePassword: undefined,
            keystoreAlias: undefined,
            keystoreAliasPassword: undefined,
        },
    },

    plugins: {
        // @capacitor-community/sqlite plugin config
        CapacitorSQLite: {
            iosDatabaseLocation: 'Library/CapacitorDatabase',
            iosIsEncryption: true,
            iosKeychainPrefix: 'PyuNovel',
            iosBiometric: {
                biometricAuth: false,
            },
            androidIsEncryption: true,
            electronIsEncryption: true,
            electronWindowsLocation: 'C:\\ProgramData\\CapacitorDatabases',
            electronMacLocation: '/Volumes/Development_Lacie/DAta/Databases',
            electronLinuxLocation: 'Databases',
        },
    },
};

export default config;
