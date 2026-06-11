const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for Expo projects.
 * This file extends the default Expo Metro config to ensure compatibility
 * with the current SDK version (54) and with the upgraded dependencies.
 */
module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  // Add any customizations here if needed.
  return defaultConfig;
})();
