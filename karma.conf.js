/* eslint-env node */

module.exports = function (config) {
  config.set({
    basePath: 'public',
    browsers: ['Chrome'],
    files: ['app.js', 'test.js'],
    frameworks: ['mocha']
  });
};
