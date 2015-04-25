/*jshint node: true */

'use strict';

module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        autoprefixer: {
            build: {
                files: {
                    '.tmp/concat/styles.css': '.tmp/concat/styles.css'
                }
            }
        },
        clean: {
            build: [
                '.tmp/**',
                'build/**'
            ],
            inline: [
                'build/**.js',
                'build/**.css'
            ],
            temporary: [
                '.tmp/**'
            ]
        },
        copy: {
            build: {
                files: {
                    'build/index.html': 'index.html'
                }
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
        }
    });

    grunt.registerTask('build', [
        'clean:build',
        'useminPrepare',
        'concat:generated',
        'autoprefixer:build',
        'cssmin:generated',
        'uglify:generated',
        'copy:build',
        'usemin',
        'inline',
        'clean:inline',
        'htmlmin:build',
        'clean:temporary'
    ]);

    grunt.registerTask('default', 'build');

};
