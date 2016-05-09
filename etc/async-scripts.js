/* eslint-env node */

'use strict';

var cheerio = require('cheerio');
var includes = require('lodash/includes');
var defaults = require('lodash/defaults');

/**
 * Given `html`, give all its scripts the `async=""` attribute.
 */
var asyncScripts = function (html, options) {
  options = defaults(options, {
    ignore: []
  });
  var $ = cheerio.load(html);
  $('script').each(function (index, script) {
    if (!includes(options.ignore, $(script).attr('src'))) {
      $(script).attr('async', '');
    }
  });
  return $.html();
};

module.exports = asyncScripts;
