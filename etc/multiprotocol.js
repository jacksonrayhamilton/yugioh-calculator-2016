/* eslint-env node */

'use strict';

var async = require('async');
var crypto = require('crypto');
var endsWith = require('lodash/endsWith');
var forOwn = require('lodash/forOwn');
var filter = require('lodash/filter');
var fs = require('fs');
var includes = require('lodash/includes');
var keys = require('lodash/keys');
var map = require('lodash/map');
var mapValues = require('lodash/mapValues');
var mkdirp = require('mkdirp');
var path = require('path');
var requirejs = require('requirejs');
var startsWith = require('lodash/startsWith');
var template = require('lodash/template');

var indexTemplate = template(fs.readFileSync(path.join(__dirname, '../app/index.html'), 'utf8'));

var md5sum = function (string) {
  return crypto.createHash('md5').update(string).digest('hex');
};

var optimize = function (build, logger, pragma, callback) {
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
      return function (listener) {
        stream.on('finish', listener);
      };
    });
    async.parallel(tasks, function () {
      callback(null, {
        summary: summary
      });
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
  }, callback);
};

var multiprotocol = {};

multiprotocol.build = function (options, callback) {
  requirejs.tools.useLib(function (req) {
    req(['build', 'logger', 'pragma'], function (build, logger, pragma) {
      optimize(build, logger, pragma, callback);
    });
  });
};

module.exports = multiprotocol;

