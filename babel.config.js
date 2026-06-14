module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@app': './app',
          },
        },
      ],
      // Reanimated 4 (SDK 54) moved its Babel plugin into react-native-worklets.
      // This MUST be listed last.
      'react-native-worklets/plugin',
    ],
  };
};
