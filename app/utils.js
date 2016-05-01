'use strict';

define(['YC'], function (YC) {

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

  YC.find = function (collection, predicate) {
    var target;
    Array.prototype.some.call(collection, function (element) {
      var result = predicate(element);
      if (result) {
        target = element;
      }
      return result;
    });
    return target;
  };

  YC.assign = function (dest, source) {
    Object.keys(source).forEach(function (key) {
      dest[key] = source[key];
    });
    return dest;
  };

});
