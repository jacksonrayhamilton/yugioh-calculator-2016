'use strict';

var ycHasOwnProperty = Function.prototype.call.bind(
  Object.prototype.hasOwnProperty
);

var ycTimes = function (max, fn) {
  var results = [];
  for (var i = 0; i < max; i += 1) {
    results.push(fn(i));
  }
  return results;
};
