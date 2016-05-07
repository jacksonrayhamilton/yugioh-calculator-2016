/* eslint-env node */

'use strict';

var cheerio = require('cheerio');
var forOwn = require('lodash/forOwn');

/**
 * Given `html`, update all scripts in `map`, where `map` is an object with keys
 * representing old `src=""` attributes, and the values are the new attributes.
 */
var replaceScripts = function (html, map) {
  var $ = cheerio.load(html);
  forOwn(map, function (newSrc, oldSrc) {
    var $mainScript = $('script[src="' + oldSrc + '"]');
    $mainScript.attr('src', newSrc);
  });
  return $.html();
};

module.exports = replaceScripts;
