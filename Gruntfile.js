/* eslint-env node */
/* eslint-disable no-console */

'use strict';

var _ = require('lodash');
var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');
var fs = require('fs');
var loadGruntTasks = require('load-grunt-tasks');
var path = require('path');

var injectIntoHtml = require('./etc/inject-into-html');
var replaceRequirePaths = require('./etc/replace-require-paths');

var indexTemplate = fs.readFileSync(path.join(__dirname, 'app/index.html'), 'utf8');

module.exports = function (grunt) {

  loadGruntTasks(grunt);

  var ports = {
    serve: 1024,
    livereload: 1025,
    karma: 1026
  };

  var libs = [
    'node_modules/require-css/css.js',
    'node_modules/mithril/mithril.js',
    'node_modules/fastclick/lib/fastclick.js'
  ];

  var isSensitiveScript = function (file) {
    return _.includes([
      'node_modules/almond/almond.js',
      'main.js'
    ], file);
  };

  var addSeparateSuffixAlways = function (file) {
    var parsed = path.parse(file);
    return path.join(parsed.dir, parsed.name + '.separate' + parsed.ext);
  };

  var addSeparateSuffix = function (file) {
    if (!isSensitiveScript(file)) {
      return addSeparateSuffixAlways(file);
    }
    return file;
  };

  var removeSeparateSuffix = function (file) {
    var parsed = path.parse(file);
    return path.join(parsed.dir, parsed.name.replace(/\.separate$/, '') + parsed.ext);
  };

  grunt.initConfig({
    clean: {
      buildDirs: [
        '.tmp/build/**',
        'build/**'
      ],
      buildSensitives: [
        'build/node_modules/almond/almond.js',
        'build/main.js'
      ],
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
    copy: (function () {
      var buildInitial = {
        files: [{
          expand: true,
          cwd: '.',
          src: libs.concat([
            'node_modules/almond/almond.js',
            'node_modules/require-css/css-builder.js',
            'node_modules/require-css/normalize.js'
          ]),
          dest: 'build'
        }, {
          expand: true,
          cwd: 'app',
          src: [
            '**/*',
            '!test-main.js',
            '!*-test.js'
          ],
          dest: 'build'
        }]
      };
      var buildRenamed = _.cloneDeep(buildInitial);
      _.pull(buildRenamed.files[1].src, '**/*.css'); // Don't re-copy the CSS.
      var rename = function (dest, src) {
        // Copy over the original files, but with their (potentially) suffixed
        // and revved names.
        var diskName = path.join(dest, addSeparateSuffix(src));
        var mappedName = grunt.filerev.summary[diskName];
        if (mappedName) {
          diskName = mappedName;
        }
        return diskName;
      };
      buildRenamed.files[0].rename = rename;
      buildRenamed.files[1].rename = rename;
      return {
        buildInitial: buildInitial,
        buildRenamed: buildRenamed
      };
    }()),
    filerev: (function () {
      var deferred = [
        'build/node_modules/almond/almond.js',
        'build/main.js'
      ];
      return {
        buildExceptDeferred: {
          src: [
            'build/**/*.{css,js}'
          ].concat(_.map(deferred, function (d) {
            return '!' + d;
          }))
        },
        buildDeferred: {
          src: deferred.concat(
            'build/**/*.{combined,separate}.{css,js}'
          )
        }
      };
    }()),
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
        files: _.map(libs, function (lib) {
          return {pattern: lib, included: false};
        }).concat([
          {pattern: 'node_modules/chai/chai.js', included: false},
          {pattern: 'app/**/*.+(css|js)', included: false},
          'app/test-main.js'
        ]),
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
      build: {
        options: {
          processors: [
            autoprefixer({browsers: '> 0%'}),
            cssnano({safe: true})
          ]
        },
        src: 'build/*.css'
      },
      serve: {
        options: {
          processors: [
            autoprefixer({browsers: '> 0%'})
          ],
          map: true
        },
        src: '.tmp/serve/*.css'
      }
    },
    requirejs: (function () {
      var wrapFile = function (moduleName, fileName, contents) {
        return '//>>fileStart("' + fileName + '")\n' + contents + '\n//>>fileEnd("' + fileName + '")\n';
      };
      var fileStartRegExp = /fileStart\s*\(\s*["'](.*?)["']\s*\)/;
      var extractFiles = function (fileContents, callback) {
        var foundIndex, lineEndIndex;
        var startIndex = 0;
        while ((foundIndex = fileContents.indexOf('//>>', startIndex)) !== -1) {
          // Found a boundary. Get the boundary line.
          lineEndIndex = fileContents.indexOf('\n', foundIndex);
          if (lineEndIndex === -1) {
            lineEndIndex = fileContents.length - 1;
          }

          // Increment startIndex past the line so the next boundary search can be done.
          startIndex = lineEndIndex + 1;

          // Break apart the boundary.
          var fileStartLine = fileContents.substring(foundIndex, lineEndIndex + 1);
          var matches = fileStartLine.match(fileStartRegExp);
          if (matches) {
            var marker = matches[1];

            // Find the endpoint marker.
            var endRegExp = new RegExp('\\/\\/\\>\\>\\s*fileEnd\\(\\s*[\'"]' + marker + '[\'"]\\s*\\)', 'g');
            var endMatches = endRegExp.exec(fileContents.substring(startIndex, fileContents.length));
            if (endMatches) {
              var endMarkerIndex = startIndex + endRegExp.lastIndex - endMatches[0].length;

              // Find the next line return based on the match position.
              lineEndIndex = fileContents.indexOf('\n', endMarkerIndex);
              if (lineEndIndex === -1) {
                lineEndIndex = fileContents.length - 1;
              }

              // Remove the boundary comments.
              var extractedFileContents = fileContents.substring(startIndex, endMarkerIndex);
              callback(marker, extractedFileContents);

              // Move startIndex to lineEndIndex, since that is the new position
              // in the file where we need to look for more boundaries in the
              // next while loop pass.
              startIndex = lineEndIndex;
            } else {
              throw new Error('Cannot find end marker for start: ' + fileStartLine);
            }
          }
        }
      };
      var reverseFileName = function (fileName) {
        var summary = grunt.filerev && grunt.filerev.summary;
        if (summary) {
          var original = _.find(_.keys(summary), function (key) {
            return fileName === path.relative('build', summary[key]);
          });
          if (original) {
            return removeSeparateSuffix(path.relative('build', original));
          }
        }
        return fileName;
      };
      var normalizeFile = function (fileName, contents) {
        if (_.includes(fileName, '!')) {
          fileName = fileName.split('!')[1];
          contents = fs.readFileSync(path.join('build', fileName), 'utf8');
        }
        if (_.startsWith(fileName, '/')) {
          fileName = path.relative(path.resolve('build'), fileName);
        }
        if (reverseFileName(fileName) === 'node_modules/require-css/css.js') {
          // Fix bug that prevents almond from working.
          contents = contents.replace(
            'var cssAPI = {};',
            'var cssAPI = {load: function (n, r, load) { load(); }};'
          );
        }
        return {
          fileName: fileName,
          contents: contents
        };
      };
      var deleteFile = function (file) {
        fs.unlinkSync(path.join('build', file));
      };
      var writeFile = function (file, data) {
        fs.writeFileSync(path.join('build', file), data);
      };
      var addToFile = function (file, data) {
        var out = path.join('build', file);
        if (fs.existsSync(out)) {
          fs.appendFileSync(out, data);
        } else {
          fs.writeFileSync(out, data);
        }
      };
      var getFileExtractor = function (separator) {
        return function (contents) {
          extractFiles(contents, separator);
        };
      };
      var buildJustSeparate = function (fileName, contents) {
        var normalized = normalizeFile(fileName, contents);
        var separateName = addSeparateSuffix(normalized.fileName);
        deleteFile(normalized.fileName);
        writeFile(separateName, normalized.contents);
      };
      var buildAlsoCombine = function (fileName, contents) {
        var normalized = normalizeFile(fileName, contents);
        var parsed = path.parse(normalized.fileName);
        var combinedName =
            (/^node_modules/.test(normalized.fileName) ? 'external' : 'internal') +
            '.combined' +
            parsed.ext;
        var separateName = normalized.fileName;
        if (isSensitiveScript(separateName)) {
          separateName = addSeparateSuffixAlways(separateName);
        }
        var addSemiColon = function (text) {
          return text + (parsed.ext === '.js' && (/;\s*$/).test(normalized.contents) ? '' : ';');
        };
        writeFile(separateName, normalized.contents);
        addToFile(combinedName, addSemiColon(normalized.contents));
        grunt.requirejs = grunt.requirejs || {combined: [], separate: []};
        if (!_.includes(grunt.requirejs.combined, combinedName)) {
          grunt.requirejs.combined.push(combinedName);
        }
        grunt.requirejs.separate.push(separateName);
      };
      return {
        options: {
          baseUrl: 'build',
          cssDir: 'build', // Option in our fork of css.js to handle `out` as a function.
          mainConfigFile: 'build/main.js',
          name: 'node_modules/almond/almond',
          include: 'main',
          pragmasOnSave: {
            excludeRequireCss: true
          },
          optimize: 'none',
          normalizeDirDefines: 'all',
          onBuildWrite: wrapFile
        },
        buildJustSeparate: {
          options: {
            out: getFileExtractor(buildJustSeparate)
          }
        },
        buildAlsoCombine: {
          options: {
            out: getFileExtractor(buildAlsoCombine)
          }
        }
      };
    }()),
    sync: {
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

  var replaceableSummary = function (relativeTo, summary) {
    var mapped = {};
    _.forOwn(summary, function (value, key) {
      var mappedKey = removeSeparateSuffix(path.relative(relativeTo, key));
      var mappedValue = path.relative(relativeTo, value);
      mapped[mappedKey] = mappedValue;
    });
    return mapped;
  };

  grunt.registerTask('replacePaths:build', function () {
    var relative = replaceableSummary('build', grunt.filerev.summary);
    var replaced = replaceRequirePaths(grunt.file.read('build/main.js'), relative);
    grunt.file.write('build/main.js', replaced);
  });

  grunt.registerTask('index:serve', function () {
    grunt.file.write('.tmp/serve/index.html', injectIntoHtml(indexTemplate, [
      'node_modules/requirejs/require.js',
      'main.js'
    ]));
  });

  var mapRevisions = function (scripts) {
    return scripts.map(function (script) {
      var revision = grunt.filerev.summary[path.join('build', script)];
      if (revision) {
        return path.relative('build', revision);
      }
      return script;
    });
  };

  grunt.registerTask('index:build', function () {
    grunt.file.write('build/index.combined.html', injectIntoHtml(indexTemplate, mapRevisions(grunt.requirejs.combined)));
    grunt.file.write('build/index.separate.html', injectIntoHtml(indexTemplate, mapRevisions(grunt.requirejs.separate)));
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
    'clean:buildDirs',
    'copy:buildInitial',
    'requirejs:buildJustSeparate',
    'postcss:build',
    'uglify:build',
    'filerev:buildExceptDeferred',
    'copy:buildRenamed',
    'replacePaths:build',
    'requirejs:buildAlsoCombine',
    'clean:buildSensitives',
    'postcss:build',
    'uglify:build',
    'filerev:buildDeferred',
    'index:build',
    'htmlmin:build'
  ]);

  grunt.registerTask('default', 'build');

};
