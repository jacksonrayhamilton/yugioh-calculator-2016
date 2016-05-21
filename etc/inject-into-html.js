/* eslint-env node */

'use strict';

var cheerio = require('cheerio');
var path = require('path');

/**
 * Inject `files` into `html`, where `files` are ".css" or ".js" files.
 */
var injectIntoHtml = function (html, files) {
  var $ = cheerio.load(html);
  files.forEach(function (file) {
    var url, async;
    if (file && typeof file === 'object') {
      url = file.url;
      async = file.async;
    } else {
      url = file;
    }
    var ext = path.extname(url);
    if (ext === '.css') {
      $('link[href="' + url + '"]').remove();
      $('head').append($('<link rel="stylesheet" href="' + url + '" />'));
    }
    if (ext === '.woff' || ext === '.woff2') {
      $('link[href="' + url + '"]').remove();
      var type = {
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
      }[ext];
      $('head').append($('<link rel="preload" href="' + url + '" as="font" type="' + type + '" crossorigin />'));
    }
    if (ext === '.js') {
      $('script[src="' + url + '"]').remove();
      $('body').append($('<script src="' + url + '"' + (async ? ' async=""' : '') + '></script>'));
    }
  });
  return $.html();
};

module.exports = injectIntoHtml;
