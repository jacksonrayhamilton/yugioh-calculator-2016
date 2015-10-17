'use strict';

/**
 * Makes an object that can emit named events to listeners.
 */
var ycMakeEventEmitter = function () {
  var eventEmitter = {};
  var events = {};
  eventEmitter.on = function (event, handler) {
    if (!ycHasOwnProperty(events, event)) {
      events[event] = [];
    }
    events[event].push(handler);
  };
  eventEmitter.off = function (event, handler) {
    if (handler === undefined) {
      events[event] = [];
    } else {
      while (true) {
        var index = events[event].indexOf(handler);
        if (index === -1) {
          break;
        }
        events[event].splice(index, 1);
      }
    }
  };
  eventEmitter.emit = function (event, data) {
    if (ycHasOwnProperty(events, event)) {
      events[event].forEach(function (handler) {
        handler(data);
      });
    }
  };
  return eventEmitter;
};
