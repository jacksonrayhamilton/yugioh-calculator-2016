'use strict';

var Utils = require('./utils');

var Persistence = {};

// Writes an object to localStorage after a delay.
Persistence.queuePersist = (function () {
  var delay = 300;
  var queue = {};
  var cancel = clearTimeout;
  return function (key, value) {
    if (Utils.hasOwn(queue, key)) {
      var previouslyQueued = queue[key];
      cancel(previouslyQueued);
    }
    queue[key] = setTimeout(function () {
      localStorage.setItem(key, JSON.stringify(value));
    }, delay);
  };
}());

// Reads an object from localStorage synchronously.
Persistence.unpersist = function (key) {
  return JSON.parse(localStorage.getItem(key));
};

module.exports = Persistence;
