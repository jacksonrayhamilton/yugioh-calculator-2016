import chai from 'chai';

// The following utilities are so ubiquitous that it is worth making them
// globally available.
window.Assertion = chai.Assertion;
window.expect = chai.expect;

// Run all test files that the application knows about.
window.require.list().filter(function (moduleName) {
  return (/-test\.js$/).test(moduleName);
}).forEach(require);
