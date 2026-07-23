import type {CapacitorConfig} from '@capacitor/cli';

// Wraps the offline build (ng build --configuration offline) into the Android APK.
const config: CapacitorConfig = {
    appId: 'pl.coderslab.splendor',
    appName: 'Splendor',
    webDir: 'dist'
};

export default config;
