/* eslint-env node */

'use strict';

var cheerio = require('cheerio');

/**
 * Given HTML `source` and module id `map`, update the element
 * `<script data-main="main.js" src="require.js"></script>` with new paths.
 */
var replaceMainScript = function (source, map) {
  var $ = cheerio.load(source);
  var $mainScript = $('script[data-main]');
  var mainSrc = $mainScript.attr('data-main');
  $mainScript.attr('data-main', map[mainSrc]);
  var requireSrc = $mainScript.attr('src');
  $mainScript.attr('src', map[requireSrc]);
  return $.html();
};

module.exports = replaceMainScript;
