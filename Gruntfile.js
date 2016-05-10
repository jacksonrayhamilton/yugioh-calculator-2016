/* eslint-env node */
/* eslint-disable no-console */

'use strict';

var assign = require('lodash/assign');
var autoprefixer = require('autoprefixer');
var async = require('async');
var crypto = require('crypto');
var endsWith = require('lodash/endsWith');
var forEach = require('lodash/forEach');
var forOwn = require('lodash/forOwn');
var filter = require('lodash/filter');
var fs = require('fs');
var includes = require('lodash/includes');
var keys = require('lodash/keys');
var loadGruntTasks = require('load-grunt-tasks');
var map = require('lodash/map');
var mapKeys = require('lodash/mapKeys');
var mapValues = require('lodash/mapValues');
var mkdirp = require('mkdirp');
var path = require('path');
var requirejs = require('requirejs');
var startsWith = require('lodash/startsWith');
var template = require('lodash/template');

var replaceRequirePaths = require('./etc/replace-require-paths');
var replaceHtmlFiles = require('./etc/replace-html-files');

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
    filerev: {
      build: {
        src: [
          'build/http1/*.js',
          'build/http2/main.js',
          'build/**/*.css'
        ]
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
            'robots.txt'
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

  var md5sum = function (string) {
    return crypto.createHash('md5').update(string).digest('hex');
  };

  grunt.registerTask('requirejsOptimize', function () {
    var done = this.async(); // eslint-disable-line no-invalid-this
    var optimize = function (build, logger, pragma) {
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
      var summary = {};
      var toTransport = build.toTransport;
      build.toTransport = function (namespace, moduleName, fileName, contents) {
        var normalized = path.parse(normalizeFileName(fileName));
        if (normalized.ext === '.js') {
          // NOTE: Not hashing compiled contents... that might leave out some edge
          // case optimizations, OR maybe it is even harmful...
          var sum = md5sum(contents).slice(0, 8);
          var newModuleName = moduleName + '.' + sum;
          var oldFileName = path.join(normalized.dir, normalized.base);
          var newFileName = path.join(normalized.dir, normalized.name + '.' + sum + normalized.ext);
          // "main.js" needs to be transformed using the hashes of other files, so
          // save it for later.
          if (oldFileName !== 'main.js') {
            summary[oldFileName] = newFileName;
          }
          arguments[1] = newModuleName;
        }
        return toTransport.apply(build, arguments);
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
          var file = normalizeFileName(fileName);
          var http1Stream;
          if (file !== 'node_modules/require-css/normalize.js') {
            var http2Dest = path.resolve('build/http2', summary[file] ? summary[file] : file);
            if (endsWith(file, '.css')) {
              styles.push(file);
              var fileStream = fs.createReadStream(path.join(baseUrl, file));
              var http2Stream = fs.createWriteStream(http2Dest);
              streams['http2/' + file] = http2Stream;
              fileStream.pipe(http2Stream);
              http1Stream =
                  startsWith(file, 'node_modules') ?
                  streams['http1/external.css'] || (streams['http1/external.css'] = fs.createWriteStream('build/http1/external.css')) :
                  streams['http1/internal.css'] || (streams['http1/internal.css'] = fs.createWriteStream('build/http1/internal.css'));
              fileStream.pipe(http1Stream);
            } else if (endsWith(file, '.js')) {
              scripts.push(file);
              // Process in case we've enabled some pragmas.
              var processed = pragma.process(fileName, contents, config, 'OnSave');
              if (file === 'node_modules/require-css/css.js') {
                // Fix bug that prevents almond from working.
                processed = processed.replace(
                  'var cssAPI = {};',
                  'var cssAPI = {load: function (n, r, load) { load(); }};'
                );
              }
              mkdirp.sync(path.dirname(http2Dest));
              fs.writeFileSync(http2Dest, processed);
              http1Stream =
                  startsWith(file, 'node_modules') ?
                  streams['http1/external.js'] || (streams['http1/external.js'] = fs.createWriteStream('build/http1/external.js')) :
                  streams['http1/internal.js'] || (streams['http1/internal.js'] = fs.createWriteStream('build/http1/internal.js'));
              http1Stream.write(processed);
            }
          }
          return contents;
        },
        logLevel: logger.SILENT
      };
      build(config).then(function () {
        forOwn(streams, function (stream, file) {
          if (endsWith(file, '.js')) {
            stream.end();
          }
        });
        var tasks = mapValues(streams, function (stream) {
          return function (callback) {
            stream.on('finish', callback);
          };
        });
        async.parallel(tasks, function () {
          grunt.requirejsOptimize = {
            summary: summary
          };
          done();
        });
        var filterByStreams = function (files) {
          return map(filter(files, function (file) {
            return includes(keys(streams), file);
          }), function (file) {
            return file.replace(/^http1\//, '');
          });
        };
        fs.writeFileSync('build/http1/index.html', indexTemplate({
          styles: filterByStreams(['http1/external.css', 'http1/internal.css']),
          scripts: filterByStreams(['http1/external.js', 'http1/internal.js'])
        }));
        fs.writeFileSync('build/http2/index.html', indexTemplate({
          styles: styles,
          scripts: scripts
        }));
      }, function (error) {
        console.error(error);
        done(false);
      });
    };
    requirejs.tools.useLib(function (req) {
      req(['build', 'logger', 'pragma'], optimize);
    });
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

  grunt.registerTask('replaceReferences', function () {
    var fSummary = grunt.filerev.summary;
    var rSummary = grunt.requirejsOptimize.summary;
    forEach(['build/http1/internal.js', 'build/http2/main.js'], function (name) {
      var dir = path.dirname(name);
      name = fSummary[name];
      var summary = assign({}, relativeSummary(dir, fSummary), rSummary);
      fs.writeFileSync(name, replaceRequirePaths(fs.readFileSync(name, 'utf8'), summary));
    });
    forEach(['build/http1', 'build/http2'], function (dir) {
      var name = path.join(dir, 'index.html');
      var summary = assign({}, relativeSummary(dir, fSummary));
      if (name === 'build/http2/index.html') {
        assign(summary, rSummary);
      }
      fs.writeFileSync(name, replaceHtmlFiles(fs.readFileSync(name, 'utf8'), summary));
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
    'requirejsOptimize',
    'filerev:build',
    'replaceReferences',
    'postcss:build',
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
