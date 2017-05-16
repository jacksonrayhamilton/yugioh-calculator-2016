/* eslint-env node */

'use strict';

var autoprefixer = require('autoprefixer')({remove: false, browsers: ['> 0%']});
var cssnano = require('cssnano')({safe: true});

module.exports = {
  files: {
    javascripts: {
      joinTo: {
        'app.js': [/.*/, '!app/test-main.js'],
        'test.js': ['app/test-main.js']
      }
    },
    stylesheets: {
      joinTo: 'app.css',
      order: {before: ['app/styles/global.css']}
    },
    templates: {joinTo: 'app.js'}
  },
  modules: {
    autoRequire: {
      'test.js': ['app/test-main']
    },
    nameCleaner: function (path) {
      // Don't strip "app/" from module paths to ensure ability to require.
      // https://github.com/brunch/brunch/issues/1441#issuecomment-241268612
      return path;
    }
  },
  plugins: {
    digest: {manifest: 'manifest.json', referenceFiles: /\.(html|css)$/},
    postcss: {processors: [autoprefixer]},
    text: {pattern: /^app\/icons\//},
    swPrecache: {
      swFileName: 'sw.js',
      options: {
        cacheId: 'yugioh-calculator',
        staticFileGlobs: [
          'public/**/*.*',
          'public/**/!(*map*)'
        ],
        stripPrefix: 'public'
      }
    }
  },
  overrides: {
    production: {
      files: {
        javascripts: {
          joinTo: {
            'app.js': [
              'app/*.js',
              '!app/test-main.js',
              '!app/*-test.js',
              /^node_modules\/mithril\//,
              /^node_modules\/fastclick\//
            ]
          }
        }
      },
      plugins: {
        postcss: {processors: [autoprefixer, cssnano]}
      }
    }
  }
};
