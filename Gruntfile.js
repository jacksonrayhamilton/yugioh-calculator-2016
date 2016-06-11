/* eslint-env node */
/* eslint-disable no-console */

'use strict';

var _ = require('lodash');
var autoprefixer = require('autoprefixer');
var allWriteTransforms = require('amodro-trace/write/all');
var amodroConfig = require('amodro-trace/config');
var amodroTrace = require('amodro-trace');
var postcssUrl = require('postcss-url');
var cssnano = require('cssnano');
var fs = require('fs');
var loadGruntTasks = require('load-grunt-tasks');
var mkdirp = require('mkdirp');
var path = require('path');
var serveStatic = require('serve-static');

var injectIntoHtml = require('./etc/inject-into-html');
var indexTemplate = fs.readFileSync(path.join(__dirname, 'app/index.html'), 'utf8');

module.exports = function (grunt) {

  loadGruntTasks(grunt);

  var ports = {
    serve: 1024,
    livereload: 1025,
    karma: 1026
  };

  var amdLib = 'node_modules/requirejs/require.js';
  var mainScript = 'build/main.js';
  var excludedModules = [
    'node_modules/require-css/normalize.js'
  ];

  grunt.initConfig({
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
          base: ['.tmp/serve', 'app'],
          middleware: function (connect, options, middlewares) {
            middlewares.push(connect().use('/node_modules', serveStatic('./node_modules')));
            return middlewares;
          }
        }
      }
    },
    copy: {
      build: {
        files: [{
          expand: true,
          cwd: 'app',
          src: ['index.html', 'fonts/**/*'],
          dest: 'build'
        }]
      }
    },
    favicons: {
      options: {
        androidHomescreen: true,
        appleTouchBackgroundColor: '#ffffff',
        appleTouchPadding: 0,
        tileBlackWhite: false,
        tileColor: 'none',
        trueColor: true
      },
      build: {
        options: {
          html: 'build/index.html'
        },
        src: 'design/icon.png',
        dest: 'build'
      }
    },
    filerev: {
      buildFirst: {
        src: [
          'build/**/*.{js,eot,svg,ttf,woff,woff2}',
          '!' + mainScript
        ]
      },
      buildCss: {
        // CSS references other revved files (like fonts) but is also referenced
        // by RequireJS so has to come before the main script.
        src: 'build/**/*.css'
      },
      buildMain: {
        // Main script references other JS and CSS.
        src: mainScript
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
          {pattern: 'app/**/*.+(css|js)', included: false},
          'app/test-main.js'
        ],
        frameworks: ['mocha', 'requirejs'],
        browsers: ['Chrome', 'Firefox'],
        port: ports.karma,
        middleware: ['static'],
        plugins: [
          'karma-*', // Default
          {'middleware:static': ['factory', function () {
            return require('connect')().use('/base/app/node_modules', serveStatic('./node_modules'));
          }]}
        ],
        client: {
          requireJsShowNoTimestampsError: '^(?!.*(^/base/app/node_modules/))'
        }
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
            postcssUrl({
              url: function (url, decl, from, dirname) {
                if (grunt.filerev) {
                  // Determined the revisioned URL.
                  var buildPath = path.join(path.relative('.', dirname), url);
                  var revisionPath = grunt.filerev.summary[buildPath];
                  if (revisionPath) {
                    return path.join(path.dirname(url), path.basename(revisionPath));
                  }
                }
                return url;
              }
            }),
            autoprefixer({browsers: '> 0%'}),
            cssnano({safe: true})
          ]
        },
        src: 'build/**/*.css'
      },
      serve: {
        options: {
          processors: [
            autoprefixer({browsers: '> 0%'})
          ],
          map: true
        },
        src: '.tmp/serve/**/*.css'
      }
    },
    sync: {
      styles: {
        files: [{
          expand: true,
          cwd: 'app/',
          src: '**/*.css',
          dest: '.tmp/serve/'
        }]
      }
    },
    uglify: {
      options: {
        screwIE8: true
      },
      buildFirst: {
        files: [{
          expand: true,
          cwd: 'build',
          src: [
            '**/*.js',
            '!' + path.relative('build', mainScript)
          ],
          dest: 'build'
        }]
      },
      buildMain: {
        files: [{
          expand: true,
          cwd: 'build',
          src: path.relative('build', mainScript),
          dest: 'build'
        }]
      }
    },
    watch: {
      scripts: {
        files: ['app/**/*.js', '!app/*-test.js'],
        options: {
          livereload: ports.livereload
        }
      },
      styles: {
        files: ['app/**/*.css'],
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
        files: ['.tmp/serve/**/*.{html,css}'],
        options: {
          livereload: ports.livereload
        }
      }
    }
  });

  grunt.registerTask('amd:build', function () {
    var done = this.async(); // eslint-disable-line no-invalid-this

    // Track module associations so we can generate HTML for them later.
    grunt.modules = grunt.modules || [];
    grunt.bundles = grunt.bundles || {};

    var readFile = function (file) {
      return fs.readFileSync(path.join('app', file), 'utf8');
    };

    var addToFile = function (file, data) {
      var out = path.join('build', file);
      if (fs.existsSync(out)) {
        fs.appendFileSync(out, data);
      } else {
        mkdirp.sync(path.dirname(out));
        fs.writeFileSync(out, data);
      }
    };

    // Make scripts safe to concatenate.
    var addSemiColon = function (file, text) {
      // Check for JS since this might be used with other file types.
      return text + (_.endsWith(file, '.js') && (/;\s*$/).test(text) ? '' : ';');
    };

    var handleModule = function (id, contents) {
      var fileName = id;
      var plugin;
      if (_.includes(fileName, '!')) {
        var split = fileName.split('!');
        plugin = split[0];
        fileName = split[1];
      }
      var fileNameNoExt = fileName;
      if (plugin && plugin === 'node_modules/require-css/css') {
        // We'll include actual CSS files in the build, since CSS generally
        // works better as CSS rather than as JS.
        fileName += '.css';
        contents = readFile(fileName);
      } else {
        // Any other module, including text modules, will be served as JS, so
        // give it the right extension so the browser always infers the MIME
        // type correctly.  (JS modules have no extension per RequireJS idioms
        // and text modules' original suffix will just be lost.)
        fileName += '.js';
      }
      if (_.includes(excludedModules, fileName)) {
        return;
      }
      var parsed = path.parse(fileName);
      // NPM handles dependency management.  Separate externally-maintained
      // scripts into another file since they probably will change less often
      // and thus will cache longer.
      var combinedName = path.join(
        parsed.dir === 'styles' ? parsed.dir : '',
        (fileName === 'main.js' ? 'main' :
         (/^node_modules/).test(fileName) ? 'external' :
         'internal') + parsed.ext
      );
      addToFile(combinedName, addSemiColon(fileName, contents));
      if (!_.includes(grunt.modules, combinedName)) {
        grunt.modules.push(combinedName);
      }
      // Main can't be bundled since it would have a reference to itself which
      // would make its revision hash unfaithful.
      if (fileName !== 'main.js') {
        if (!Object.prototype.hasOwnProperty.call(grunt.bundles, combinedName)) {
          grunt.bundles[combinedName] = [];
        }
        grunt.bundles[combinedName].push(fileNameNoExt);
      }
    };

    // In case the modules were not located in the right order, ensure they do
    // load in the right order.
    var sortModules = function (modules) {
      modules.sort(function (a, b) {
        return (
          (path.parse(a).name === 'external' && path.parse(b).name !== 'external') ? -1 :
          (path.parse(a).name !== 'external' && path.parse(b).name === 'external') ? 1 :
          0
        );
      });
    };

    // Override file handling logic so we can organize our code more nicely.
    var fileHandler = function (defaultHandler, id, filePath) {
      if (/^node_modules/.test(id) && !(/!/).test(id)) {
        // Resolve `node_modules` one level up, as it isn't actually inside the
        // `app` directory.
        return defaultHandler(id, path.resolve(path.relative('app', filePath)));
      }
      return defaultHandler(id, filePath);
    };

    var loaderConfig = amodroConfig.find(fs.readFileSync('app/main.js', 'utf8'));
    loaderConfig.dir = 'build'; // For require-css.

    amodroTrace({
      rootDir: path.join(__dirname, 'app'),
      id: 'main',
      fileExists: fileHandler,
      fileRead: fileHandler,
      includeContents: true,
      writeTransform: allWriteTransforms()
    }, loaderConfig).then(function (traceResult) {
      handleModule(amdLib, grunt.file.read(amdLib));
      _.forEach(traceResult.traced, function (result) {
        handleModule(result.id, result.contents);
      });
      sortModules(grunt.modules);
      done();
    }).catch(function (reason) {
      console.error(reason);
      done(false);
    });
  });

  var stripExtension = function (file) {
    var parsed = path.parse(file);
    return path.join(parsed.dir, parsed.name);
  };

  var mapBundlesThroughSummary = function (bundles, summary) {
    return _.mapKeys(bundles, function (value, key) {
      return stripExtension(path.relative('build', summary[path.join('build', key)]));
    });
  };

  var modifyConfig = function (currentConfig) {
    currentConfig.bundles = currentConfig.bundles || {};
    _.defaults(
      currentConfig.bundles,
      mapBundlesThroughSummary(grunt.bundles, grunt.filerev.summary)
    );
    return currentConfig;
  };

  grunt.registerTask('modifyConfig:build', function () {
    var modifiedConfig = amodroConfig.modify(grunt.file.read(mainScript), modifyConfig);
    grunt.file.write(mainScript, modifiedConfig);
  });

  grunt.registerTask('index:serve', function () {
    grunt.file.write('.tmp/serve/index.html', injectIntoHtml(indexTemplate, [
      amdLib,
      'main.js'
    ]));
  });

  var mapRevisions = function (files) {
    return _.map(files, function (file) {
      var revision = grunt.filerev.summary[path.join('build', file)];
      return revision ? path.relative('build', revision) : file;
    });
  };

  var preloadedFiles = [
    // Only Chrome supports <link rel="preload"> right now, and since Chrome
    // will download every font type it supports, only send woff2.  (In the
    // future we might want to preload regular woff as well.)
    'fonts/ubuntu-mono.woff2'
  ];

  var prepareHtml = function (files) {
    var html = grunt.file.read('build/index.html');
    return injectIntoHtml(html, mapRevisions(files));
  };

  grunt.registerTask('index:build', function () {
    var htmlFiles = preloadedFiles.concat(grunt.modules);
    grunt.file.write('build/index.html', prepareHtml(htmlFiles));
  });

  grunt.registerTask('staticAssets:build', function () {
    // Save the paths to the static assets so the web server can safely
    // determine what to set high expiration headers on.
    var staticAssets = _.values(grunt.filerev.summary);
    grunt.file.write('build/static-assets.json', JSON.stringify(staticAssets));
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
    'copy:build',
    'amd:build',
    'uglify:buildFirst',
    'filerev:buildFirst',
    'postcss:build',
    'filerev:buildCss',
    'modifyConfig:build',
    'uglify:buildMain',
    'filerev:buildMain',
    'favicons:build',
    'index:build',
    'htmlmin:build',
    'staticAssets:build'
  ]);

  grunt.registerTask('default', 'build');

};
