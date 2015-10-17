'use strict';

/**
 * Writes an object to localStorage after a delay.
 */
var ycQueuePersist = (function () {
  var delay = 300;
  var queue = {};
  var cancel = clearTimeout;
  return function queue(key, value) {
    if (ycHasOwnProperty(queue, key)) {
      var previouslyQueued = queue[key];
      cancel(previouslyQueued);
    }
    queue[key] = setTimeout(function () {
      localStorage.setItem(key, JSON.stringify(value));
    }, delay);
  };
}());

/**
 * Reads an object from localStorage synchronously.
 */
var ycUnpersist = function (key) {
  return JSON.parse(localStorage.getItem(key));
};
