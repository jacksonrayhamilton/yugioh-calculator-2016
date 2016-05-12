/* eslint-env node */

'use strict';

var assign = require('lodash/assign');
var autoprefixer = require('autoprefixer');
var crypto = require('crypto');
var csso = require('csso');
var endsWith = require('lodash/endsWith');
var forEach = require('lodash/forEach');
var find = require('lodash/find');
var fs = require('fs');
var identity = require('lodash/identity');
var join = require('lodash/join');
var map = require('lodash/map');
var mkdirp = require('mkdirp');
var omit = require('lodash/omit');
var path = require('path');
var postcss = require('postcss');
var requirejs = require('requirejs');
var startsWith = require('lodash/startsWith');
var tmp = require('tmp');
var UglifyJS = require('uglify-js');

var injectIntoHtml = require('./inject-into-html');
var replaceRequirePaths = require('./replace-require-paths');

var endsWithSemiColonRegExp = /;\s*$/;

/**
 * Some JS may not be valid if concatenated with other JS, in particular the
 * style of omitting semicolons and rely on ASI.  Add a semicolon in those
 * cases.
 */
var addSemiColon = function (text, config) {
  if (config.skipSemiColonInsertion || endsWithSemiColonRegExp.test(text)) {
    return text;
  } else {
    return text + ';';
  }
};

var md5sum = function (string) {
  return crypto.createHash('md5').update(string).digest('hex');
};

var hashFile = function (contents) {
  return md5sum(contents).slice(0, 8);
};

var optimizeCss = function (css) {
  css = postcss([
    autoprefixer({
      browsers: '> 0%'
    })
  ]).process(css).css;
  css = csso.minify(css).css;
  return css;
};

var optimizeJs = function (code) {
  return UglifyJS.minify(code, {fromString: true}).code;
};

var optimize = function (build, logger, pragma, options, callback) {
  var dir = options.dir;
  if (!dir) {
    throw new Error('Missing required option "dir"');
  }

  var libDir = options.libDir;
  if (!libDir) {
    throw new Error('Missing required option "libDir"');
  }

  var htmlIndex = options.htmlIndex;
  if (!htmlIndex) {
    throw new Error('Missing required option "htmlIndex"');
  }

  var baseUrl = options.baseUrl || '';
  var mainConfigFile = options.mainConfigFile;

  // Create output directories.
  var tmpdir = tmp.dirSync().name;

  var config = assign({
    // This option may be overridden.
    logLevel: logger.SILENT
  }, omit(options, 'dir', 'libDir', 'htmlIndex'), {
    // These options probably shouldn't be overridden.
    optimize: 'none',
    normalizeDirDefines: 'all',
    out: path.join(tmpdir, 'ignore')
  });

  /**
   * Get the absolute path to a file.  (There is probably a much better,
   * "official" way of doing this with the plugins' APIs.)
   */
  var normalizeFileName = function (fileName) {
    if (startsWith(fileName, path.join(libDir, 'require-css/css!'))) {
      return fileName.split('!')[1] + '.css';
    }
    if (startsWith(fileName, '/')) {
      return path.relative(path.resolve(baseUrl), fileName);
    }
    return fileName;
  };

  var processJs = function (fileName, code) {
    // Process in case we've enabled some pragmas.
    code = pragma.process(fileName, code, config, 'OnSave');
    if (normalizeFileName(fileName) === path.join(libDir, 'require-css/css.js')) {
      // Fix bug that prevents almond from working.
      code = code.replace(
        'var cssAPI = {};',
        'var cssAPI = {load: function (n, r, load) { load(); }};'
      );
    }
    return code;
  };

  var processFile = function (fileName, contents) {
    var parsed = path.parse(normalizeFileName(fileName));
    if (parsed.ext === '.js') {
      contents = processJs(fileName, contents);
    }
    return contents;
  };

  var optimizeFile = function (fileName, contents) {
    var parsed = path.parse(normalizeFileName(fileName));
    if (parsed.ext === '.css') {
      contents = optimizeCss(contents);
    } else if (parsed.ext === '.js') {
      contents = optimizeJs(contents);
    }
    return contents;
  };

  var isMainConfigFile = function (fileName) {
    return path.join(baseUrl, normalizeFileName(fileName)) === mainConfigFile;
  };

  var getFileContents = function (file) {
    return fs.readFileSync(path.join(baseUrl, file), 'utf8');
  };

  /**
   * Mapping of file names to hashes of their contents.
   */
  var fileHashes = {};

  // Patch an internal build method so we can intercept and change module names.
  // We want the files to have the proper suffixes and for the modules to have
  // names that match.  This way, output files can be loaded via html, OR via
  // RequireJS dynamically.
  var toTransport = build.toTransport;
  build.toTransport = function (namespace, moduleName, fileName) {
    var inFile = normalizeFileName(fileName);
    var contents = getFileContents(inFile);
    // The main configuration needs to be transformed using the hashes of each
    // file, so save it for later.
    if (!isMainConfigFile(fileName)) {
      contents = processFile(fileName, contents);
      contents = optimizeFile(fileName, contents);
      var hash = hashFile(contents);
      fileHashes[inFile] = hash;
      var newModuleName = moduleName + '.' + hash + '.separate';
      arguments[1] = newModuleName;
    }
    return toTransport.apply(build, arguments);
  };

  var createWriter = function (suffix, mapName) {
    mapName = mapName || identity;
    var renames = {};
    var requireRenames = renames;
    var files = [];
    var writer = {};

    writer.getRenames = function () {
      return renames;
    };

    writer.useRequireRenames = function (instead) {
      requireRenames = instead;
    };

    var renameFile = function (inFile) {
      if (fileHashes[inFile] === undefined) {
        return;
      }
      var parsed = path.parse(inFile);
      var outFile = path.join(parsed.dir, parsed.name + '.' + fileHashes[inFile] + '.' + suffix + parsed.ext);
      renames[inFile] = outFile;
    };

    writer.addFile = function (inFileName, contents) {
      var inFile = normalizeFileName(inFileName);
      renameFile(inFile);
      var outFile = mapName(inFile);
      var file = find(files, {name: outFile});
      if (!file) {
        renameFile(outFile);
        file = {
          name: outFile,
          parts: []
        };
        files.push(file);
      }
      file.parts.push({
        name: inFile,
        contents: processFile(inFileName, contents)
      });
    };

    var writeFile = function (file, contents) {
      mkdirp.sync(path.dirname(path.join(dir, file)));
      fs.writeFileSync(path.join(dir, file), contents);
    };

    var writeFiles = function () {
      forEach(files, function (file) {
        var inFile = file.name;
        var contents = join(map(file.parts, function (part) {
          var partContents = part.contents;
          if (isMainConfigFile(part.name)) {
            partContents = replaceRequirePaths(partContents, requireRenames);
          }
          if (endsWith(part.name, '.js')) {
            partContents = addSemiColon(partContents, config);
          }
          return partContents;
        }), '\n');
        contents = optimizeFile(inFile, contents);
        if (!fileHashes[inFile]) {
          fileHashes[inFile] = hashFile(contents);
        }
        renameFile(inFile);
        var outFile = renames[inFile];
        writeFile(outFile, contents);
      });
    };

    var writeIndex = function () {
      var html = fs.readFileSync(htmlIndex, 'utf8');
      html = injectIntoHtml(html, map(files, function (file) {
        return renames[file.name];
      }));
      var parsed = path.parse(htmlIndex);
      var outFile = path.join(parsed.dir, parsed.name + '.' + suffix + parsed.ext);
      outFile = path.relative(baseUrl, outFile);
      writeFile(outFile, html);
    };

    writer.finish = function () {
      writeFiles();
      writeIndex();
    };

    return writer;
  };

  var combinedWriter = createWriter('combined', function (file) {
    return (startsWith(file, libDir) ? 'external' : 'internal') + path.extname(file);
  });
  var separateWriter = createWriter('separate');

  config.onBuildWrite = function (moduleName, fileName, contents) {
    var normalized = normalizeFileName(fileName);
    if (endsWith(normalized, '.css')) {
      contents = getFileContents(normalized);
    }
    separateWriter.addFile(fileName, contents);
    combinedWriter.addFile(fileName, contents);
    return contents;
  };

  build(config).then(function () {
    separateWriter.finish();
    combinedWriter.useRequireRenames(separateWriter.getRenames());
    combinedWriter.finish();
    callback();
  }).then(callback, callback);
};

var optimizeWrapper = function (options, callback) {
  requirejs.tools.useLib(function (req) {
    req(['build', 'logger', 'pragma'], function (build, logger, pragma) {
      optimize(build, logger, pragma, options, callback);
    });
  });
};

module.exports = optimizeWrapper;
