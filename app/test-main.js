/* global __karma__ */

'use strict';

require.config({

  // Karma serves files under `/base`, i.e. the `basePath` from the config file.
  baseUrl: '/base/app',

  map: {
    '*': {
      'css': 'node_modules/require-css/css',
      'm': 'node_modules/mithril/mithril',
      'FastClick': 'node_modules/fastclick/lib/fastclick',
      'chai': 'node_modules/chai/chai'
    }
  },

  // Get a list of all test files to include.
  deps: Object.keys(__karma__.files).reduce(function (testFiles, file) {
    if (/^\/base\/app\/.*-test\.js$/.test(file)) {
      // Normalize paths to RequireJS module names.
      var normalized = file.replace(/^\/base\/app\/|\.js$/g, '');
      return testFiles.concat(normalized);
    }
    return testFiles;
  }, ['chai']), // Arguments to the initial callback.

  callback: function (chai) {
    // The following utilities are so ubiquitous that it is worth making them
    // globally available.
    window.Assertion = chai.Assertion;
    window.expect = chai.expect;

    // We have to kickoff the test runner, as it is asynchronous.
    __karma__.start();
  }

});
