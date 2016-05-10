/* eslint-env node */

'use strict';

var autoprefixer = require('autoprefixer');
var async = require('async');
var endsWith = require('lodash/endsWith');
var forEach = require('lodash/forEach');
var forOwn = require('lodash/forOwn');
var filter = require('lodash/filter');
var fs = require('fs');
var includes = require('lodash/includes');
var keys = require('lodash/keys');
var loadGruntTasks = require('load-grunt-tasks');
var mapValues = require('lodash/mapValues');
var mkdirp = require('mkdirp');
var path = require('path');
var requirejs = require('requirejs');
var startsWith = require('lodash/startsWith');
var template = require('lodash/template');

var indexTemplate = template(fs.readFileSync(path.join(__dirname, 'app/index.html'), 'utf8'));

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
      serve: ['.tmp/serve/**']
    },
    connect: {
      serve: {
        options: {
          port: ports.serve,
          livereload: ports.livereload,
          hostname: '*',
          base: ['.tmp/serve', 'app']
        }
      }
    },
    cssmin: {
      build: {
        files: [{
          expand: true,
          cwd: 'build',
          src: ['**/*.css'],
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
        files: [{
          expand: true,
          cwd: 'build',
          src: ['**/*.html'],
          dest: 'build'
        }]
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
        src: 'build/**/*.css'
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
            'robots.txt'
          ],
          dest: 'build/http1'
        }, {
          expand: true,
          cwd: 'app',
          src: [
            'robots.txt',
            '**/*.css'
          ],
          dest: 'build/http2'
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
      html: {
        files: ['app/index.html'],
        tasks: ['indexTemplate:serve']
      },
      livereload: {
        options: {
          livereload: ports.livereload
        },
        files: ['.tmp/serve/*.{html,css}']
      }
    }
  });

  grunt.registerTask('indexTemplate:serve', function () {
    grunt.file.write('.tmp/serve/index.html', indexTemplate({
      scripts: [
        'node_modules/requirejs/require.js',
        'main.js'
      ]
    }));
  });

  grunt.registerTask('requirejsOptimize', function () {
    var done = this.async(); // eslint-disable-line no-invalid-this
    var optimize = function (logger, pragma) {
      mkdirp.sync('.tmp/build');
      mkdirp.sync('build/http1');
      mkdirp.sync('build/http2');
      var baseUrl = 'app';
      var normalizeFileName = function (fileName) {
        if (/^node_modules\/require-css\/css!/.test(fileName)) {
          return fileName.split('!')[1] + '.css';
        }
        return path.relative(path.resolve(baseUrl), fileName);
      };
      var styles = [];
      var scripts = [];
      var streams = {};
      var config = {
        baseUrl: baseUrl,
        mainConfigFile: 'app/main.js',
        //  Use if not dynamically loading JS.
        name: 'node_modules/almond/almond',
        include: 'main',
        // Use if dynamically loading JS.
        // name: 'main',
        optimize: 'none',
        out: '.tmp/build/ignore',
        pragmasOnSave: {
          // Enable if not dynamically loading CSS.
          excludeRequireCss: true
        },
        onBuildWrite: function (moduleName, fileName, contents) {
          var out = normalizeFileName(fileName);
          if (out !== 'node_modules/require-css/normalize.js') {
            if (endsWith(out, '.css')) {
              styles.push(out);
            } else if (endsWith(out, '.js')) {
              scripts.push(out);
              var processed = pragma.process(fileName, contents, config, 'OnSave');
              if (out === 'node_modules/require-css/css.js') {
                // Fix bug that prevents almond from working.
                processed = processed.replace(
                  'var cssAPI = {};',
                  'var cssAPI = {load: function (n, r, load) { load(); }};'
                );
              }
              var dest = path.resolve('build/http2', out);
              mkdirp.sync(path.dirname(dest));
              fs.writeFileSync(dest, processed);
              var http1Stream =
                  startsWith(out, 'node_modules') ?
                  streams['external.js'] || (streams['external.js'] = fs.createWriteStream('build/http1/external.js')) :
                  streams['internal.js'] || (streams['internal.js'] = fs.createWriteStream('build/http1/internal.js'));
              http1Stream.write(processed);
            }
          }
          return contents;
        },
        logLevel: logger.SILENT
      };
      requirejs.optimize(config, function () {
        forOwn(streams, function (stream) {
          stream.end();
        });
        forEach(styles, function (file) {
          var out =
              startsWith(file, 'node_modules') ?
              streams['external.css'] || (streams['external.css'] = fs.createWriteStream('build/http1/external.css')) :
              streams['internal.css'] || (streams['internal.css'] = fs.createWriteStream('build/http1/internal.css'));
          fs.createReadStream(path.resolve(baseUrl, file)).pipe(out);
        });
        var tasks = mapValues(streams, function (stream) {
          return function (callback) {
            stream.on('finish', callback);
          };
        });
        async.parallel(tasks, done);
        var filterByStreams = function (files) {
          return filter(files, function (file) {
            return includes(keys(streams), file);
          });
        };
        fs.writeFileSync('build/http1/index.html', indexTemplate({
          styles: filterByStreams(['external.css', 'internal.css']),
          scripts: filterByStreams(['external.js', 'internal.js'])
        }));
        fs.writeFileSync('build/http2/index.html', indexTemplate({
          styles: styles,
          scripts: scripts
        }));
      });
    };
    requirejs.tools.useLib(function (req) {
      req(['logger', 'pragma'], optimize);
    });
  });

  grunt.registerTask('test', [
    'karma:single'
  ]);

  grunt.registerTask('test:auto', [
    'karma:auto'
  ]);

  grunt.registerTask('serve', [
    'clean:serve',
    'indexTemplate:serve',
    'sync:styles',
    'postcss:serve',
    'connect:serve',
    'watch'
  ]);

  grunt.registerTask('build', [
    'clean:build',
    'sync:build',
    'postcss:build',
    'requirejsOptimize',
    'cssmin:build',
    'uglify:build',
    'htmlmin:build'
  ]);

  grunt.registerTask('deploy', [
    'build',
    'aws_s3:deploy'
  ]);

  grunt.registerTask('default', 'build');

};
