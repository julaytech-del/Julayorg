import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.julay.app',
  appName: 'Julay', // v1.0
  webDir: 'dist',
  server: {
    url: 'https://julay.org',
    androidScheme: 'https',
    cleartext: false,
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
