import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ausbildungsuche.app',
  appName: 'AusbildungsSuche',
  webDir: 'dist',
  server: {
    // Allow navigation to external URLs (e.g. Arbeitsagentur links)
    allowNavigation: ['*.arbeitsagentur.de'],
  },
  android: {
    backgroundColor: '#0a0a1a',
    allowMixedContent: true,
  },
  ios: {
    backgroundColor: '#0a0a1a',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
};

export default config;
