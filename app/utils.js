(function () {

  'use strict';

  YC.hasOwn = Function.prototype.call.bind(
    Object.prototype.hasOwnProperty
  );

  YC.times = function (max, fn) {
    var results = [];
    for (var i = 0; i < max; i += 1) {
      results.push(fn(i));
    }
    return results;
  };

  YC.assign = function (dest, source) {
    Object.keys(source).forEach(function (key) {
      dest[key] = source[key];
    });
    return dest;
  };

}());
