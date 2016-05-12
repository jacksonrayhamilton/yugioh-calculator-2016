/* eslint-env node */
/* eslint-disable no-console */

'use strict';

var autoprefixer = require('autoprefixer');
var fs = require('fs');
var loadGruntTasks = require('load-grunt-tasks');
var path = require('path');

var optimize = require('./etc/optimize');
var injectIntoHtml = require('./etc/inject-into-html');

var indexTemplate = fs.readFileSync(path.join(__dirname, 'app/index.html'), 'utf8');

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
          dest: 'build'
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
        tasks: ['index:serve']
      },
      livereload: {
        options: {
          livereload: ports.livereload
        },
        files: ['.tmp/serve/*.{html,css}']
      }
    }
  });

  grunt.registerTask('index:serve', function () {
    grunt.file.write('.tmp/serve/index.html', injectIntoHtml(indexTemplate, [
      'node_modules/requirejs/require.js',
      'main.js'
    ]));
  });

  grunt.registerTask('optimize', function () {
    var done = this.async(); // eslint-disable-line no-invalid-this
    optimize({
      baseUrl: 'app',
      mainConfigFile: 'app/main.js',
      name: 'node_modules/almond/almond',
      include: 'main',
      pragmasOnSave: {
        excludeRequireCss: true
      },
      dir: 'build',
      libDir: 'node_modules',
      htmlIndex: 'app/index.html'
    }, function (error) {
      if (error) {
        console.error(error);
        done(false);
      }
      done();
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
    'index:serve',
    'sync:styles',
    'postcss:serve',
    'connect:serve',
    'watch'
  ]);

  grunt.registerTask('build', [
    'clean:build',
    'sync:build',
    'optimize',
    'htmlmin:build'
  ]);

  grunt.registerTask('deploy', [
    'build',
    'aws_s3:deploy'
  ]);

  grunt.registerTask('default', 'build');

};
