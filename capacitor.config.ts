import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hisense.app', // Change to com.hiclarify.app if you want a separate install identity
  appName: 'HI Clarify',
  webDir: 'cap-build',
  server: {
    url: "https://hi-sense.vercel.app",
    cleartext: false
  },
  // When deployed, set server.url to your Vercel URL so the WebView loads the live app.
  // Local: npm run build && npm run start, then server: { url: 'http://10.0.2.2:3000', cleartext: true }
  // server: { url: 'https://your-app.vercel.app', cleartext: true },
};

export default config;
