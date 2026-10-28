import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pottyplay.companion",
  appName: "PottyPlay",
  webDir: "out",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    cleartext: process.env.NODE_ENV !== "production",
    url: process.env.CAPACITOR_SERVER_URL || undefined,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0D0F12",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0D0F12",
    },
    PrivacyScreen: {
      enable: true,
    },
  },
};

export default config;
