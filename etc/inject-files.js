/* eslint-env node */

'use strict';

var cheerio = require('cheerio');

/**
 * Inject `files` into `html`, where `files` are ".css" or ".js" files.
 */
var injectFiles = function (html, files) {
  var $ = cheerio.load(html);
  files.forEach(function (file) {
    if (/\.css$/.test(file)) {
      $('link[href="' + file + '"]').remove();
      $('head').append($('<link rel="stylesheet" href="' + file + '" />'));
    }
    if (/\.js$/.test(file)) {
      $('script[src="' + file + '"]').remove();
      $('body').append($('<script src="' + file + '"></script>'));
    }
  });
  return $.html();
};

module.exports = injectFiles;
