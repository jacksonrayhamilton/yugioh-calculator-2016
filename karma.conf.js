/* eslint-env node */

export default function (config) {
  config.set({
    basePath: 'public',
    browsers: ['Chrome'],
    files: ['app.js', 'test.js'],
    frameworks: ['mocha']
  });
};
