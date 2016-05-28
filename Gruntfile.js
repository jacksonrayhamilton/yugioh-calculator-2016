/* eslint-env node */
/* eslint-disable no-console */

'use strict';

var _ = require('lodash');
var autoprefixer = require('autoprefixer');
var allWriteTransforms = require('amodro-trace/write/all');
var amodroConfig = require('amodro-trace/config');
var amodroTrace = require('amodro-trace');
var cachebuster = require('postcss-cachebuster');
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

  var libs = [
    'node_modules/require-css/css.js',
    'node_modules/text/text.js',
    'node_modules/mithril/mithril.js',
    'node_modules/fastclick/lib/fastclick.js'
  ];

  var isExcludedModule = function (file) {
    return _.includes([
      'node_modules/require-css/normalize.js'
    ], file);
  };

  var combinedMainScript = 'build/main.combined.js';
  var separateMainScript = 'build/main.separate.js';
  var mainScripts = [
    combinedMainScript,
    separateMainScript
  ];

  var stripExtension = function (file) {
    var parsed = path.parse(file);
    return path.join(parsed.dir, parsed.name);
  };

  grunt.initConfig({
    clean: {
      buildDirs: [
        'build/**'
      ],
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
          cwd: '.',
          src: amdLib,
          dest: 'build'
        }, {
          expand: true,
          cwd: 'app',
          src: 'fonts/**/*',
          dest: 'build'
        }]
      }
    },
    filerev: {
      buildFirst: {
        src: [
          'build/**/*.{js,eot,svg,ttf,woff,woff2}'
        ].concat(_.map(mainScripts, function (file) {
          // Main scripts must maintain their names for modifyConfig.
          return '!' + file;
        }))
      },
      buildCss: {
        // CSS references other revved files (like fonts) but is also referenced
        // by RequireJS so has to come before main scripts.
        src: 'build/**/*.css'
      },
      buildMain: {
        // Main scripts reference other JS and CSS.
        src: mainScripts
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
                  assetPath = path.relative('build', grunt.filerev.summary[path.relative('.', assetPath)]);
                }
                return path.join('..', assetPath);
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
            '**/*.js'
          ].concat(_.map(mainScripts, function (file) {
            return '!' + path.relative('build', file);
          })),
          dest: 'build'
        }]
      },
      buildMain: {
        files: [{
          expand: true,
          cwd: 'build',
          src: _.map(mainScripts, function (file) {
            return path.relative('build', file);
          }),
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
    grunt.modules = grunt.modules || {combined: [amdLib], separate: [amdLib]};
    grunt.bundles = grunt.bundles || {combined: {}, separate: {}};

    var readFile = function (file) {
      return fs.readFileSync(path.join('app', file), 'utf8');
    };

    var writeFile = function (file, data) {
      file = path.join('build', file);
      mkdirp.sync(path.dirname(file));
      fs.writeFileSync(file, data);
    };

    var addToFile = function (file, data) {
      var out = path.join('build', file);
      if (fs.existsSync(out)) {
        fs.appendFileSync(out, data);
      } else {
        writeFile(file, data);
      }
    };

    // Make scripts safe to concatenate.
    var addSemiColon = function (file, text) {
      // Check for JS since this might be used with other file types.
      return text + (_.endsWith(file, '.js') && (/;\s*$/).test(text) ? '' : ';');
    };

    var addSuffix = function (file, suffix) {
      var parsed = path.parse(file);
      return path.join(parsed.dir, parsed.name + suffix + parsed.ext);
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
      if (isExcludedModule(fileName)) {
        return;
      }
      var separateName = fileName;
      if (fileName === 'main.js') {
        separateName = addSuffix(fileName, '.separate');
      }
      writeFile(separateName, contents);
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
      var combinedId = stripExtension(combinedName);
      if (fileName === 'main.js') {
        combinedName = addSuffix(fileName, '.combined');
      }
      addToFile(combinedName, addSemiColon(fileName, contents));
      if (!_.find(grunt.modules.combined, {id: combinedId})) {
        grunt.modules.combined.push({
          id: combinedId,
          file: combinedName
        });
      }
      grunt.modules.separate.push({
        // Store module ID and file name so we can generate the proper <script>
        // attributes to imitate RequireJS loading.
        id: id,
        file: separateName
      });
      // Main can't be bundled since it would have a reference to itself which
      // would make its revision hash unfaithful.
      if (fileName !== 'main.js') {
        if (!Object.prototype.hasOwnProperty.call(grunt.bundles.combined, combinedName)) {
          grunt.bundles.combined[combinedName] = [];
        }
        grunt.bundles.combined[combinedName].push(fileNameNoExt);
        grunt.bundles.separate[separateName] = [fileNameNoExt];
      }
    };

    // In case the modules were not located in the right order, ensure they do
    // load in the right order.
    var sortModules = function (modules) {
      modules.sort(function (a, b) {
        if (_.isObject(a)) {
          a = a.file;
        }
        if (_.isObject(b)) {
          b = b.file;
        }
        if (path.parse(a).name === 'external' && path.parse(b).name !== 'external' && b !== amdLib) {
          return -1;
        }
        if (path.parse(a).name !== 'external' && a !== amdLib && path.parse(b).name === 'external') {
          return 1;
        }
        return 0;
      });
    };

    var loaderConfig = amodroConfig.find(fs.readFileSync('app/main.js', 'utf8'));
    loaderConfig.dir = 'build'; // For require-css.

    amodroTrace({
      rootDir: path.join(__dirname, 'app'),
      id: 'main',
      includeContents: true,
      writeTransform: allWriteTransforms()
    }, loaderConfig).then(function (traceResult) {
      _.forEach(traceResult.traced, function (result) {
        handleModule(result.id, result.contents);
      });
      sortModules(grunt.modules.combined);
      done();
    }).catch(function (reason) {
      console.error(reason);
      done(false);
    });
  });

  var mapBundlesThroughSummary = function (bundles, summary) {
    return _.mapKeys(bundles, function (value, key) {
      return stripExtension(path.relative('build', summary[path.join('build', key)]));
    });
  };

  grunt.registerTask('modifyConfig:build', function () {
    _.forEach([{
      mainScript: combinedMainScript,
      bundles: grunt.bundles.combined
    }, {
      mainScript: separateMainScript,
      bundles: grunt.bundles.separate
    }], function (pair) {
      var mainScript = pair.mainScript;
      var bundles = pair.bundles;
      var replaced = amodroConfig.modify(grunt.file.read(mainScript), function (currentConfig) {
        currentConfig.bundles = currentConfig.bundles || {};
        _.defaults(currentConfig.bundles, mapBundlesThroughSummary(bundles, grunt.filerev.summary));
        return currentConfig;
      });
      grunt.file.write(mainScript, replaced);
    });
  });

  grunt.registerTask('index:serve', function () {
    grunt.file.write('.tmp/serve/index.html', injectIntoHtml(indexTemplate, [
      'node_modules/requirejs/require.js',
      'main.js'
    ]));
  });

  var mapRevisions = function (files) {
    return _.map(files, function (file) {
      var moduleId;
      if (_.isObject(file)) {
        moduleId = file.id;
        file = file.file;
      }
      var revision = grunt.filerev.summary[path.join('build', file)];
      file = {
        url: file,
        attrs: {}
      };
      if (revision) {
        file.url = path.relative('build', revision);
      }
      if (moduleId) {
        file.attrs['async'] = '';
        file.attrs['data-requirecontext'] = '_';
        file.attrs['data-requiremodule'] = moduleId;
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
    grunt.file.write('build/index.combined.html', prepareHtml(grunt.modules.combined.concat(preloadedFiles)));
    grunt.file.write('build/index.separate.html', prepareHtml(grunt.modules.separate.concat(preloadedFiles)));
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
    'copy:build',
    'amd:build',
    'uglify:buildFirst',
    'filerev:buildFirst',
    'postcss:build',
    'filerev:buildCss',
    'modifyConfig:build',
    'uglify:buildMain',
    'filerev:buildMain',
    'index:build',
    'htmlmin:build'
  ]);

  grunt.registerTask('default', 'build');

};
