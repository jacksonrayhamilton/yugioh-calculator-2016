'use strict';

var Utils = {};

// Determine if an object has an own property.  (Shortcut for
// `Object.prototype.hasOwnProperty.call(object, propertyName)`.)
Utils.hasOwn = Function.prototype.call.bind(
  Object.prototype.hasOwnProperty
);

// Call `fn` a total of `max` times, accumulating the results of `fn` and
// returning them in an array in order.
Utils.times = function (max, fn) {
  var results = [];
  for (var i = 0; i < max; i += 1) {
    results.push(fn(i));
  }
  return results;
};

// Return the first element in `collection` for which `predicate` returns a
// truthy value.
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

// Copy the own properties of `source` to `dest`.
Utils.assign = function (dest, source) {
  Object.keys(source).forEach(function (key) {
    dest[key] = source[key];
  });
  return dest;
};

module.exports = Utils;
