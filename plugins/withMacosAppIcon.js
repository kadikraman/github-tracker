const fs = require('fs');
const path = require('path');
const { withMacOSDangerous } = require('expo-desktop-config-plugins/plugins/macos/macos-plugins');

// Neither Spark nor Expo Desktop generates a macOS icon set from `expo.icon`,
// so the generated AppIcon set is replaced with the committed one.
const SOURCE = path.join(__dirname, '..', 'assets', 'AppIcon.appiconset');

module.exports = function withMacosAppIcon(config) {
  return withMacOSDangerous(config, (config) => {
    // modRequest.projectName is unset for macOS dangerous mods.
    const root = config.modRequest.platformProjectRoot;
    const targets = fs
      .readdirSync(root)
      .filter((name) => name.endsWith('-macOS'))
      .map((name) => path.join(root, name, 'Assets.xcassets', 'AppIcon.appiconset'))
      .filter((target) => fs.existsSync(target));
    if (targets.length !== 1) {
      throw new Error(`withMacosAppIcon: expected one AppIcon set in ${root}, found ${targets.length}`);
    }
    const [target] = targets;
    fs.rmSync(target, { recursive: true });
    fs.cpSync(SOURCE, target, { recursive: true });
    return config;
  });
};
