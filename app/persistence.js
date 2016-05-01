(function () {

  'use strict';

  /**
   * Writes an object to localStorage after a delay.
   */
  YC.queuePersist = (function () {
    var delay = 300;
    var queue = {};
    var cancel = clearTimeout;
    return function (key, value) {
      if (YC.hasOwn(queue, key)) {
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
  YC.unpersist = function (key) {
    return JSON.parse(localStorage.getItem(key));
  };

}());
