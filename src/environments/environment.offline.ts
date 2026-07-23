// Build used for the Android APK: no server, every API call is served by
// _offline/offline-backend.ts. apiUrl is only a prefix the interceptors match on.
export const environment = {
    production: true,
    offline: true,
    apiUrl: 'http://offline.local'
};
