module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['expo-router/babel'], // هذا السطر ضروري جداً لتشغيل التطبيق
  };
};
