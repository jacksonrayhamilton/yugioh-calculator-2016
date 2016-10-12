/* eslint-env node */

'use strict';

module.exports = function (config) {
  config.set({
    basePath: 'public',
    browsers: ['Chrome'],
    files: ['app.js', 'test.js'],
    frameworks: ['mocha']
  });
};
