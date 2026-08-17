let withAppBuildGradle;
try {
  withAppBuildGradle = require('@expo/config-plugins').withAppBuildGradle;
} catch (e) {
  // Mock for EAS control plane which reads config before npm install
  withAppBuildGradle = (config) => config;
}

module.exports = function withAndroidABIFilter(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const appendCode = `
// Appended by withAndroidABIFilter
android {
    defaultConfig {
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a"
        }
    }
}
`;
      // Check if already appended
      if (!config.modResults.contents.includes('Appended by withAndroidABIFilter')) {
        config.modResults.contents += appendCode;
      }
    }
    return config;
  });
};
