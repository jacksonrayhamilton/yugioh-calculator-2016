/* eslint-env node */
/* eslint-disable no-console */

'use strict';

var _ = require('lodash');
var autoprefixer = require('autoprefixer');
var cachebuster = require('postcss-cachebuster');
var cssnano = require('cssnano');
var fs = require('fs');
var loadGruntTasks = require('load-grunt-tasks');
var path = require('path');
var serveStatic = require('serve-static');

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

  var amdLibs = [
    'node_modules/requirejs/require.js',
    'node_modules/almond/almond.js'
  ];

  var buildLibs = amdLibs.concat([
    'node_modules/require-css/css-builder.js',
    'node_modules/require-css/normalize.js'
  ]);

  var libs = [
    'node_modules/require-css/css.js',
    'node_modules/text/text.js',
    'node_modules/mithril/mithril.js',
    'node_modules/fastclick/lib/fastclick.js'
  ];

  var isSensitiveScript = function (file) {
    return _.includes(amdLibs.concat([
      'main.js'
    ]), file);
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

  // r.js doesn't let us use `exclude` if we use `out`.
  var isExcludedModule = function (file) {
    return _.includes([
      'node_modules/require-css/normalize.js'
    ], reverseFileName(file));
  };

  var canBeAsync = function (file) {
    if (path.extname(file) !== '.js') {
      return false;
    }
    return !_.includes(amdLibs.concat([
      'internal.combined.js',
      'external.combined.js'
    ]), reverseFileName(file));
  };

  grunt.initConfig({
    clean: {
      buildDirs: [
        '.tmp/build/**',
        'build/**'
      ],
      buildLeftovers: {
        files: [{
          expand: true,
          cwd: 'build',
          src: buildLibs.concat([
            'main.js'
          ])
        }]
      },
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
    copy: (function () {
      var buildInitial = {
        files: [{
          expand: true,
          cwd: '.',
          src: buildLibs.concat(libs),
          dest: 'build'
        }, {
          expand: true,
          cwd: 'app',
          src: [
            '**/*',
            '!index.html',
            '!test-main.js',
            '!*-test.js'
          ],
          dest: 'build'
        }]
      };
      var buildRenamed = _.cloneDeep(buildInitial);
      buildRenamed.files[1].src.push('!{fonts,icons}/*');
      var rename = function (dest, src) {
        // Copy over the original files, but with their (potentially) suffixed
        // and revved names.
        var separateName = path.join(dest, addSeparateSuffix(src));
        var mappedName = grunt.filerev.summary[separateName];
        if (mappedName) {
          return mappedName;
        }
        return path.join(dest, src);
      };
      buildRenamed.files[0].rename = rename;
      buildRenamed.files[1].rename = rename;
      return {
        buildInitial: buildInitial,
        buildRenamed: buildRenamed
      };
    }()),
    filerev: (function () {
      var deferred = amdLibs.concat([
        'main.js'
      ]);
      return {
        buildExceptDeferred: {
          src: [
            'build/**/*.{css,js,eot,svg,ttf,woff,woff2}'
          ].concat(_.map(buildLibs.concat(deferred), function (d) {
            return '!' + path.join('build', d);
          }))
        },
        buildDeferred: {
          src: [
            'build/**/*.{combined,separate}.{css,js}'
          ].concat(_.map(deferred, function (d) {
            return path.join('build', d);
          }))
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
            cachebuster({
              // In our fork of cachebuster, `type` can be a function that
              // returns a new pathname for the asset.
              type: function (assetPath) {
                if (grunt.filerev) {
                  return path.relative('build', grunt.filerev.summary[path.relative('.', assetPath)]);
                }
                return assetPath;
              }
            }),
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

      var normalizeFile = function (fileName, contents) {
        var originalFileName, originalContents;
        if (_.includes(fileName, '!')) {
          var split = fileName.split('!');
          var plugin = split[0];
          fileName = split[1];
          if (reverseFileName(plugin + '.js') === 'node_modules/text/text.js') {
            originalFileName = fileName;
            fileName += '.js';
          }
          if (originalFileName || _.endsWith(fileName, '.css')) {
            var readContents = fs.readFileSync(path.join('build', originalFileName || fileName), 'utf8');
            if (originalFileName) {
              originalContents = readContents;
            } else {
              contents = readContents;
            }
          }
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
          originalFileName: originalFileName,
          originalContents: originalContents,
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

      var buildJustSeparate = function (fileName, contents) {
        var normalized = normalizeFile(fileName, contents);
        if (isExcludedModule(normalized.fileName)) {
          return;
        }
        if (normalized.originalFileName) {
          deleteFile(normalized.originalFileName);
          writeFile(addSeparateSuffix(normalized.originalFileName), normalized.originalContents);
        } else {
          deleteFile(normalized.fileName);
          writeFile(addSeparateSuffix(normalized.fileName), normalized.contents);
        }
      };

      var buildAlsoCombine = function (fileName, contents) {
        var normalized = normalizeFile(fileName, contents);
        if (isExcludedModule(normalized.fileName)) {
          return;
        }
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

      var getFileExtractor = function (separator) {
        return function (contents) {
          extractFiles(contents, separator);
        };
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

  var replaceableSummary = function (summary) {
    var mapped = {};
    _.forOwn(summary, function (value, key) {
      var mappedKey = removeSeparateSuffix(path.relative('build', key));
      var mappedValue = path.relative('build', value);
      mapped[mappedKey] = mappedValue;
    });
    return mapped;
  };

  grunt.registerTask('replacePaths:build', function () {
    var replaceable = replaceableSummary(grunt.filerev.summary);
    var replaced = replaceRequirePaths(grunt.file.read('build/main.js'), replaceable);
    grunt.file.write('build/main.js', replaced);
  });

  grunt.registerTask('index:serve', function () {
    grunt.file.write('.tmp/serve/index.html', injectIntoHtml(indexTemplate, [
      'node_modules/requirejs/require.js',
      'main.js'
    ]));
  });

  var mapRevisions = function (files) {
    return _.map(files, function (file) {
      var revision = grunt.filerev.summary[path.join('build', file)];
      if (revision) {
        file = path.relative('build', revision);
      }
      if (canBeAsync(file)) {
        file = {
          url: file,
          async: true
        };
      }
      return file;
    });
  };

  var preloadedFiles = [
    // Only Chrome supports <link rel="preload"> right now, and since Chrome
    // will download every font type it supports, only send woff2.  (In the
    // future we might want to preload regular woff as well.)
    'fonts/ubuntu-mono.woff2'
  ];

  var prepareHtml = function (files) {
    return injectIntoHtml(indexTemplate, mapRevisions(files));
  };

  grunt.registerTask('index:build', function () {
    grunt.file.write('build/index.combined.html', prepareHtml(grunt.requirejs.combined.concat(preloadedFiles)));
    grunt.file.write('build/index.separate.html', prepareHtml(grunt.requirejs.separate.concat(preloadedFiles)));
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
    'clean:buildLeftovers',
    'postcss:build',
    'uglify:build',
    'filerev:buildDeferred',
    'index:build',
    'htmlmin:build'
  ]);

  grunt.registerTask('default', 'build');

};
