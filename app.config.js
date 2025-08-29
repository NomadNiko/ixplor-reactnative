const { existsSync } = require('fs');
const { join } = require('path');

// Try to load auth config, fallback to empty object if not found
let authConfig = {};
const authConfigPath = join(process.cwd(), 'auth.config.js');

if (existsSync(authConfigPath)) {
  try {
    authConfig = require('./auth.config.js');
  } catch (error) {
    console.warn('Failed to load auth.config.js:', error.message);
  }
} else {
  console.warn('auth.config.js not found. Please create it from auth.config.example.js');
}

module.exports = {
  expo: {
    name: 'iXplor',
    slug: 'ixplor',
    version: '1.0.1',
    scheme: 'ixplor',
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-web-browser',
      'expo-secure-store',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'This app uses location to show nearby vendors and services on the map.',
          locationAlwaysPermission:
            'This app uses location to show nearby vendors and services on the map.',
          locationWhenInUsePermission:
            'This app uses location to show your position on the map and nearby vendors.',
        },
      ],
      'expo-apple-authentication',
      'expo-image-picker',
      'expo-font',
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1D7FFF',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'us.nomadsoft.ixplor',
      usesAppleSignIn: true,
      icon: {
        dark: './assets/ios-dark.png',
        light: './assets/ios-light.png',
        tinted: './assets/ios-tinted.png',
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          'This app uses location to show your position on the map and nearby vendors.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'This app uses location to show nearby vendors and services on the map.',
        NSCameraUsageDescription: 'This app uses the camera to take profile pictures.',
        NSPhotoLibraryUsageDescription:
          'This app accesses your photo library to select profile pictures.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1D7FFF',
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
      ],
      package: 'us.nomadsoft.ixplor',
    },
    extra: {
      router: {},
      eas: {
        projectId: authConfig.easProjectId || 'your-eas-project-id',
      },
      googleAuth: {
        webClientId: authConfig.googleAuth?.webClientId || 'your-web-client-id',
        iosClientId: authConfig.googleAuth?.iosClientId || 'your-ios-client-id',
        androidClientId: authConfig.googleAuth?.androidClientId || 'your-android-client-id',
      },
      apiConfig: {
        baseUrl: authConfig.apiConfig?.baseUrl || 'https://server.ixplor.app/api',
      },
      stripe: {
        publishableKey:
          authConfig.stripe?.publishableKey || 'pk_test_your-stripe-publishable-key-here',
      },
      googlePlaces: {
        apiKey: authConfig.googlePlaces?.apiKey || 'your-google-places-api-key-here',
      },
    },
  },
};
