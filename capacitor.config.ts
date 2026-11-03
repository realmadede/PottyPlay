import type { CapacitorConfig } from "@capacitor/cli";

const emulatorDev = process.env.CAPACITOR_EMULATOR_DEV === "true";

const config: CapacitorConfig = {
  appId: "com.pottyplay.companion",
  appName: "PottyPlay",
  webDir: "out",
  server: {
    androidScheme: emulatorDev ? "http" : "https",
    iosScheme: "https",
    cleartext: emulatorDev,
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
      enable: !emulatorDev,
    },
    LocalNotifications: {
      smallIcon: "ic_launcher_round",
      iconColor: "#F59E0B",
      sound: "beep.wav",
    },
  },
};

export default config;
