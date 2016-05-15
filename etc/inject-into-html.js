/* eslint-env node */

'use strict';

var cheerio = require('cheerio');

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
    if (/\.css$/.test(url)) {
      $('link[href="' + url + '"]').remove();
      $('head').append($('<link rel="stylesheet" href="' + url + '" />'));
    }
    if (/\.js$/.test(url)) {
      $('script[src="' + url + '"]').remove();
      $('body').append($('<script src="' + url + '"' + (async ? ' async=""' : '') + '></script>'));
    }
  });
  return $.html();
};

module.exports = injectIntoHtml;
