/* eslint-env node */

'use strict';

var cheerio = require('cheerio');
var endsWith = require('lodash/endsWith');
var forOwn = require('lodash/forOwn');

/**
 * Given `html`, update all scripts in `map`, where `map` is an object with keys
 * representing old `src=""` or `href=""` attributes, and the values are the new
 * attributes.
 */
var replaceHtmlFiles = function (html, map) {
  var $ = cheerio.load(html);
  forOwn(map, function (newName, oldName) {
    if (endsWith(oldName, '.css')) {
      $('link[rel="stylesheet"][href="' + oldName + '"]').attr('href', newName);
    } else if (endsWith(oldName, '.js')) {
      $('script[src="' + oldName + '"]').attr('src', newName);
    }
  });
  return $.html();
};

module.exports = replaceHtmlFiles;
