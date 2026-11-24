import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stackingrace.app',
  appName: 'Stacking Race',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
