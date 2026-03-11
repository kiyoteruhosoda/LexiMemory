/* eslint-disable */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
// Two levels up: apps/mobile -> apps -> frontend (workspace root)
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire workspace so Metro can resolve files in frontend/src/
config.watchFolders = [workspaceRoot];

// Resolve node_modules from both the app directory and the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force react-native and react to always resolve from the mobile app's local
// node_modules (0.76.9 / 18.3.1), not from the workspace root (0.84.x / 19.x).
// Files in frontend/packages/ui/ also import react-native; without this they
// would walk up to frontend/node_modules/react-native@0.84 which uses `match`
// syntax that Metro 0.80.9's hermes-parser cannot parse.
config.resolver.extraNodeModules = {
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react': path.resolve(projectRoot, 'node_modules/react'),
};

module.exports = config;
