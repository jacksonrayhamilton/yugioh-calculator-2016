/* eslint-env node */
/* eslint-disable no-console */

'use strict';

var assign = require('lodash/assign');
var autoprefixer = require('autoprefixer');
var forEach = require('lodash/forEach');
var fs = require('fs');
var loadGruntTasks = require('load-grunt-tasks');
var mapKeys = require('lodash/mapKeys');
var mapValues = require('lodash/mapValues');
var path = require('path');
var template = require('lodash/template');

var multiprotocol = require('./etc/multiprotocol');
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

  grunt.registerTask('requirejsOptimize', function () {
    var done = this.async(); // eslint-disable-line no-invalid-this
    multiprotocol.build({}, function (error, results) {
      if (error) {
        throw error;
      }
      grunt.requirejsOptimize = results;
      done();
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
