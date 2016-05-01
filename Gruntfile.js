/* eslint-env node */

'use strict';

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    autoprefixer: {
      build: {
        files: {
          '.tmp/concat/styles.css': '.tmp/concat/styles.css'
        }
      },
      serve: {
        options: {
          map: true
        },
        files: [{
          expand: true,
          cwd: '.tmp/serve/',
          src: '*.css',
          dest: '.tmp/serve/'
        }]
      }
    },
    clean: {
      build: [
        '.tmp/concat/**',
        'build/**'
      ],
      postBuild: [
        '.tmp/concat/**'
      ],
      serve: [
        '.tmp/serve/**'
      ]
    },
    connect: {
      options: {
        open: false,
        port: 1024,
        livereload: 35729,
        middleware: function (connect) {
          return [
            connect.static('.tmp/serve'),
            connect().use(
              '/node_modules',
              connect.static('./node_modules')
            ),
            connect.static('app')
          ];
        }
      },
      serve: {}
    },
    copy: {
      build: {
        files: [{
          expand: true,
          cwd: 'app/',
          src: ['index.html', 'robots.txt'],
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
    filerev: {
      build: {
        src: 'build/*.{css,js}'
      }
    },
    htmlmin: {
      build: {
        options: {
          removeComments: true,
          collapseWhitespace: true,
          conservativeCollapse: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true,
          removeEmptyAttributes: true,
          removeOptionalTags: true
        },
        files: {
          'build/index.html': 'build/index.html'
        }
      }
    },
    usemin: {
      options: {
        assetsDirs: ['build/']
      },
      html: 'build/index.html'
    },
    useminPrepare: {
      options: {
        dest: 'build/'
      },
      html: 'app/index.html'
    },
    watch: {
      scripts: {
        files: ['app/*.js'],
        options: {
          livereload: true
        }
      },
      styles: {
        files: ['app/*.css'],
        tasks: [
          'copy:styles',
          'autoprefixer:serve'
        ]
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          'app/index.html',
          '.tmp/serve/*.css'
        ]
      }
    }
  });

  grunt.registerTask('serve', [
    'clean:serve',
    'copy:styles',
    'autoprefixer:serve',
    'connect:serve',
    'watch'
  ]);

  grunt.registerTask('build', [
    'clean:build',
    'useminPrepare',
    'concat:generated',
    'autoprefixer:build',
    'cssmin:generated',
    'uglify:generated',
    'copy:build',
    'filerev:build',
    'usemin',
    'htmlmin:build',
    'clean:postBuild'
  ]);

  grunt.registerTask('default', 'build');

};
