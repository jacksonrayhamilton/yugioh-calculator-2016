/* global __karma__, require */

'use strict';

(function () {

  // Add additional testing libraries to the configuration.
  require.paths['chai'] = 'node_modules/chai/chai';

  Object.keys(require.paths).forEach(function (module) {
    if (/^node_modules/.test(require.paths[module])) {
      // Unlike in the development and deployment environments, Karma serves
      // `node_modules` one level up.
      require.paths[module] = '../' + require.paths[module];
    }
  });

  // Karma serves files under `/base`, i.e. the `basePath` from the config file.
  require.baseUrl = '/base/app';

  // These will be required immediately after RequireJS loads.
  var testDeps = ['chai'];

  // Get a list of all test files to include.
  require.deps = Object.keys(__karma__.files).reduce(function (testFiles, file) {
    if (/-test\.js$/.test(file)) {
      // Normalize paths to RequireJS module names.
      var normalized = file.replace(/^\/base\/app\/|\.js$/g, '');
      return testFiles.concat(normalized);
    }
    return testFiles;
  }, testDeps);

  require.callback = function (chai) {
    // The following utilities are so ubiquitous that it is worth making them
    // globally available.
    window.Assertion = chai.Assertion;
    window.expect = chai.expect;

    // We have to kickoff the test runner, as it is asynchronous.
    __karma__.start();
  };

}());
