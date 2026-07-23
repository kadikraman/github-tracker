const { getDefaultConfig } = require("@expo/metro-config");
const { makeMetroConfig } = require("@rnx-kit/metro-config");

const config = makeMetroConfig(getDefaultConfig(__dirname));

// Expo's default platform list omits "macos"; without it the release
// bundle command (react-native-macos bundle.js) rejects the platform.
config.resolver.platforms = [
  ...new Set(["macos", ...(config.resolver.platforms ?? ["ios", "android"])]),
];

module.exports = config;
