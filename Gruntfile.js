/*jshint node: true */

'use strict';

var _ = require('lodash');

var lodashBuildOutputPath = 'build/lodash.js';

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
            inline: [
                'build/**.js',
                'build/**.css'
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
                livereload: 35729
            },
            serve: {
                options: {
                    base: [
                        '.tmp/serve/',
                        './'
                    ]
                }
            }
        },
        copy: {
            build: {
                files: {
                    'build/index.html': 'index.html'
                }
            },
            styles: {
                src: '*.css',
                dest: '.tmp/serve/'
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
        inline: {
            build: {
                options: {
                    tag: ''
                },
                files: {
                    'build/index.html': 'build/index.html'
                }
            }
        },
        lodash: {
            build: {
                options: {
                    modifier: 'modern',
                    exports: ['global'],
                    include: [
                        'find',
                        'forEach',
                        'map',
                        'reduce',
                        'times'
                    ]
                },
                dest: lodashBuildOutputPath
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
            html: 'index.html'
        },
        watch: {
            scripts: {
                files: ['application.js'],
                options: {
                    livereload: true
                }
            },
            styles: {
                files: ['*.css'],
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
                    '*.html',
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

    // Update the usemin `concat:generated` task to use the custom lodash build.
    grunt.registerTask('hijackLodash', function () {
        var config = grunt.config.get('concat');
        var scriptsConfig = _.find(config.generated.files, function (config) {
            return /scripts\.js/.test(config.dest);
        });
        var lodashIndex = _.findIndex(scriptsConfig.src, function (path) {
            return /lodash\.js/.test(path);
        });
        scriptsConfig.src = [].concat(
            _.slice(scriptsConfig.src, 0, lodashIndex),
            lodashBuildOutputPath,
            _.slice(scriptsConfig.src, lodashIndex + 1)
        );
        grunt.config.set('concat', config);
    });

    grunt.registerTask('build', [
        'clean:build',
        'useminPrepare',
        'lodash:build',
        'hijackLodash',
        'concat:generated',
        'autoprefixer:build',
        'cssmin:generated',
        'uglify:generated',
        'copy:build',
        'usemin',
        'inline',
        'clean:inline',
        'htmlmin:build',
        'clean:postBuild'
    ]);

    grunt.registerTask('default', 'build');

};
