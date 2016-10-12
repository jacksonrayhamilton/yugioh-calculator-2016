'use strict';

var chai = require('chai');

// The following utilities are so ubiquitous that it is worth making them
// globally available.
window.Assertion = chai.Assertion;
window.expect = chai.expect;

window.require.list().filter(function (moduleName) {
  return (/-test\.js$/).test(moduleName);
}).forEach(require);
