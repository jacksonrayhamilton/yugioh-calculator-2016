'use strict';

var Utils = {};

Utils.hasOwn = Function.prototype.call.bind(
  Object.prototype.hasOwnProperty
);

Utils.times = function (max, fn) {
  var results = [];
  for (var i = 0; i < max; i += 1) {
    results.push(fn(i));
  }
  return results;
};

Utils.find = function (collection, predicate) {
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

Utils.assign = function (dest, source) {
  Object.keys(source).forEach(function (key) {
    dest[key] = source[key];
  });
  return dest;
};

module.exports = Utils;
