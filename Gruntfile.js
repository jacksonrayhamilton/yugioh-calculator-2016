/* eslint-env node */

'use strict';

var autoprefixer = require('autoprefixer');
var loadGruntTasks = require('load-grunt-tasks');
var mapKeys = require('lodash/mapKeys');
var mapValues = require('lodash/mapValues');
var path = require('path');
var serveStatic = require('serve-static');

var replaceRequirePaths = require('./etc/replace-require-paths');
var replaceMainScript = require('./etc/replace-main-script');

module.exports = function (grunt) {

  loadGruntTasks(grunt);

  var ports = {
    serve: 1024,
    livereload: 1025
  };

  grunt.initConfig({
    clean: {
      build: ['build/**'],
      serve: ['.tmp/serve/**']
    },
    connect: {
      serve: {
        options: {
          port: ports.serve,
          livereload: ports.livereload,
          hostname: '*',
          base: ['.tmp/serve', 'app'],
          middleware: function (connect, options, middlewares) {
            middlewares.push(connect().use('/node_modules', serveStatic('./node_modules')));
            return middlewares;
          }
        }
      }
    },
    cssmin: {
      build: {
        files: [{
          expand: true,
          cwd: 'build',
          src: ['*.css'],
          dest: 'build'
        }]
      }
    },
    filerev: {
      nonMain: {
        src: ['build/**/*.{css,js}', '!build/main.js']
      },
      main: {
        src: ['build/main.js']
      }
    },
    htmlmin: {
      build: {
        options: {
          caseSensitive: true,
          collapseBooleanAttributes: true,
          collapseInlineTagWhitespace: true,
          collapseWhitespace: true,
          conservativeCollapse: true,
          decodeEntities: true,
          processConditionalComments: true,
          removeAttributeQuotes: true,
          removeComments: true,
          removeEmptyAttributes: true,
          removeOptionalTags: true,
          removeRedundantAttributes: true,
          removeTagWhitespace: true,
          sortAttributes: true,
          sortClassName: true
        },
        files: {
          'build/index.html': 'build/index.html'
        }
      }
    },
    postcss: {
      options: {
        processors: [
          autoprefixer({
            browsers: '> 0%'
          })
        ]
      },
      build: {
        src: 'build/*.css'
      },
      serve: {
        options: {
          map: true
        },
        src: '.tmp/serve/*.css'
      }
    },
    sync: {
      build: {
        files: [{
          expand: true,
          cwd: 'app',
          src: [
            'index.html',
            'robots.txt',
            '*.{css,js}',
            '!*-test.js'
          ],
          dest: 'build/'
        }, {
          expand: true,
          cwd: '.',
          src: [
            'node_modules/requirejs/require.js',
            'node_modules/require-css/css.js',
            'node_modules/mithril/mithril.js',
            'node_modules/fastclick/lib/fastclick.js'
          ],
          dest: 'build/'
        }]
      },
      styles: {
        files: [{
          expand: true,
          cwd: 'app/',
          src: '*.css',
          dest: '.tmp/serve/'
        }]
      }
    },
    uglify: {
      options: {
        screwIE8: true
      },
      nonMain: {
        files: [{
          expand: true,
          cwd: 'build',
          src: ['**/*.js'],
          dest: 'build'
        }]
      },
      main: {
        src: 'build/main.js',
        dest: 'build/main.js'
      }
    },
    watch: {
      scripts: {
        files: ['app/*.js'],
        options: {
          livereload: ports.livereload
        }
      },
      styles: {
        files: ['app/*.css'],
        tasks: [
          'sync:styles',
          'postcss:serve'
        ]
      },
      livereload: {
        options: {
          livereload: ports.livereload
        },
        files: [
          'app/index.html',
          '.tmp/serve/*.css'
        ]
      }
    }
  });

  /**
   * Make `summary` keys and values relative to the path `relativeTo`.
   */
  var relativeSummary = function (relativeTo, summary) {
    return mapKeys(mapValues(summary, function (value) {
      return path.relative(relativeTo, value);
    }), function (value, key) {
      return path.relative(relativeTo, key);
    });
  };

  grunt.registerTask('replaceRequirePaths', function () {
    var summary = relativeSummary('build', grunt.filerev.summary);
    var replaced = replaceRequirePaths(grunt.file.read('build/main.js'), summary);
    grunt.file.write('build/main.js', replaced);
    grunt.log.ok('Replaced require paths with revisions');
  });

  grunt.registerTask('replaceMainScript', function () {
    var summary = relativeSummary('build', grunt.filerev.summary);
    var replaced = replaceMainScript(grunt.file.read('build/index.html'), summary);
    grunt.file.write('build/index.html', replaced);
    grunt.log.ok('Replaced index scripts with revisions');
  });

  grunt.registerTask('serve', [
    'clean:serve',
    'sync:styles',
    'postcss:serve',
    'connect:serve',
    'watch'
  ]);

  grunt.registerTask('build', [
    'clean:build',
    'sync:build',
    'postcss:build',
    'cssmin:build',
    'uglify:nonMain',
    'filerev:nonMain',
    'replaceRequirePaths',
    'uglify:main',
    'filerev:main',
    'replaceMainScript',
    'htmlmin:build'
  ]);

  grunt.registerTask('default', 'build');

};
