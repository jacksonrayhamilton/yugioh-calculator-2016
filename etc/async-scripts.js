/* eslint-env node */

'use strict';

var cheerio = require('cheerio');
var includes = require('lodash/includes');

/**
 * Given `html`, give all its scripts the `async=""` attribute.
 */
var asyncScripts = function (html, files) {
  var $ = cheerio.load(html);
  $('script').each(function (index, script) {
    if (includes(files, $(script).attr('src'))) {
      $(script).attr('async', '');
    }
  });
  return $.html();
};

module.exports = asyncScripts;
