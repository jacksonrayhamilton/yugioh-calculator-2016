/* eslint-env node */

'use strict';

module.exports = {
  files: {
    javascripts: {joinTo: 'app.js'},
    stylesheets: {
      joinTo: 'app.css',
      order: {before: ['app/styles/global.css']}
    },
    templates: {joinTo: 'app.js'}
  },
  modules: {
    autoRequire: {
      'app.js': ['app/main']
    },
    nameCleaner: function (path) {
      // Don't strip "app/" from module paths to ensure ability to require.
      // https://github.com/brunch/brunch/issues/1441#issuecomment-241268612
      return path;
    }
  },
  plugins: {
    postcss: {processors: [require('autoprefixer')({remove: false, browsers: ['> 0%']})]},
    text: {pattern: /^app\/icons\//}
  }
};
