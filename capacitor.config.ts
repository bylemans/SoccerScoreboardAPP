import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.scoreboardapp',
  appName: 'Scoreboard APP',
  webDir: 'dist',
  server: {
    url: 'https://1eab03f4-7eec-4a04-8a88-b5ab2744ec7f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
