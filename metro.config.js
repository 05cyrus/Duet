const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// --- Firebase JS SDK compatibility ---
// The Firebase JS SDK ships CommonJS (.cjs) entrypoints, and Expo SDK 53+
// enables Metro's package-exports resolver by default. That combination makes
// `firebase/auth` resolve to a build that fails at runtime with
// "Component auth has not been registered yet". Adding the cjs source ext and
// disabling the unstable package-exports resolver is the documented fix.
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
