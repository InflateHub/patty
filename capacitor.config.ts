import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.patty.app',
  appName: 'Patty',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      fadeOutDuration: 300,
      backgroundColor: '#5C7A6E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    LocalNotifications: {
      // smallIcon: must reference an existing res/drawable — omit to use plugin default
      iconColor: '#5C7A6E',
      // sound: omit — 'beep.wav' does not exist in res/raw; system default is used
    },
  },
};

export default config;
