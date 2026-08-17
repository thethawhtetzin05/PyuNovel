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
      // Find the defaultConfig block and add ndk abiFilters
      config.modResults.contents = config.modResults.contents.replace(
        /defaultConfig\s*\{/,
        `defaultConfig {\n        ndk {\n            abiFilters "armeabi-v7a", "arm64-v8a"\n        }`
      );
    }
    return config;
  });
};
