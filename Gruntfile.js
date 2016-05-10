/* eslint-env node */

'use strict';

var autoprefixer = require('autoprefixer');
var endsWith = require('lodash/endsWith');
var fs = require('fs');
var loadGruntTasks = require('load-grunt-tasks');
var path = require('path');
var requirejs = require('requirejs');
var serveStatic = require('serve-static');
var without = require('lodash/without');

var injectFiles = require('./etc/inject-files');
var asyncScripts = require('./etc/async-scripts');

module.exports = function (grunt) {

  loadGruntTasks(grunt);

  var ports = {
    serve: 1024,
    livereload: 1025,
    karma: 1026
  };

  grunt.initConfig({
    aws_s3: {
      options: {
        awsProfile: 'yugiohcalculator',
        bucket: 'new.yugiohcalculator.com'
      },
      deploy: {
        options: {
          differential: true
        },
        files: [
          {cwd: 'build/', dest: '/', action: 'delete'},
          {expand: true, cwd: 'build/', src: ['**'], dest: '/', action: 'upload'}
        ]
      }
    },
    clean: {
      build: ['build/**'],
      requirejsOptimize: [
        'build/node_modules/require-css/css-builder.js',
        'build/node_modules/require-css/normalize.js',
        'build/_ignore.js'
      ],
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
    karma: {
      options: {
        files: [
          {pattern: 'node_modules/require-css/css.js', included: false},
          {pattern: 'node_modules/mithril/mithril.js', included: false},
          {pattern: 'node_modules/fastclick/lib/fastclick.js', included: false},
          {pattern: 'node_modules/chai/chai.js', included: false},
          {pattern: 'app/**/*.+(css|js)', included: false},
          'app/test-main.js'
        ],
        frameworks: ['mocha', 'requirejs'],
        browsers: ['Chrome', 'Firefox'],
        port: ports.karma
      },
      single: {
        options: {
          singleRun: true
        }
      },
      auto: {
        options: {
          singleRun: false
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
            '!test-main.js',
            '!*-test.js'
          ],
          dest: 'build/'
        }, {
          expand: true,
          cwd: '.',
          src: [
            'node_modules/requirejs/require.js',
            'node_modules/require-css/css.js',
            'node_modules/require-css/css-builder.js',
            'node_modules/require-css/normalize.js',
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
      build: {
        files: [{
          expand: true,
          cwd: 'build',
          src: ['**/*.js'],
          dest: 'build'
        }]
      }
    },
    watch: {
      scripts: {
        files: ['app/*.js', '!app/*-test.js'],
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

  grunt.registerTask('requirejsOptimize', function () {
    var done = this.async(); // eslint-disable-line no-invalid-this
    var baseUrl = 'build';
    var normalizeFilePath = function (filePath) {
      if (/^node_modules\/require-css\/css!/.test(filePath)) {
        return filePath.split('!')[1] + '.css';
      }
      return path.relative(path.resolve(baseUrl), filePath);
    };
    var files = [];
    requirejs.optimize({
      baseUrl: baseUrl,
      mainConfigFile: 'build/main.js',
      name: 'main',
      optimize: 'none',
      out: 'build/_ignore.js',
      onBuildWrite: function (moduleName, filePath, contents) {
        var out = normalizeFilePath(filePath);
        if (out !== 'node_modules/require-css/normalize.js') {
          files.push(out);
        }
        if (endsWith(out, '.js')) {
          fs.writeFileSync(path.resolve(baseUrl, out), contents);
        }
        return contents;
      },
      logLevel: 4 // logger.SILENT
    }, function () {
      grunt.requirejsOptimize = {
        files: files
      };
      done();
    });
  });

  grunt.registerTask('requirejsInject', function () {
    var html = grunt.file.read('build/index.html');
    var files = grunt.requirejsOptimize.files;
    html = injectFiles(html, files);
    html = asyncScripts(html, without(files, [
      'node_modules/requirejs/require.js'
    ]));
    grunt.file.write('build/index.html', html);
    grunt.log.ok('Injected  files');
  });

  grunt.registerTask('test', [
    'karma:single'
  ]);

  grunt.registerTask('test:auto', [
    'karma:auto'
  ]);

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
    'requirejsOptimize',
    'clean:requirejsOptimize',
    'uglify:build',
    'requirejsInject',
    'htmlmin:build'
  ]);

  grunt.registerTask('deploy', [
    'build',
    'aws_s3:deploy'
  ]);

  grunt.registerTask('default', 'build');

};
