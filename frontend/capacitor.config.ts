import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eliteai.workos',
  appName: 'WorkOS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0F172A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F172A'
    }
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0F172A'
  },
  android: {
    backgroundColor: '#0F172A',
    allowMixedContent: true
  }
};

export default config;
