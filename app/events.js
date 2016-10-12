'use strict';

var Utils = require('./utils');

/**
 * Makes an object that can emit named events to listeners.
 */
var Events = function () {
  var events = {};
  var map = {};
  events.on = function (event, handler) {
    if (!Utils.hasOwn(map, event)) {
      map[event] = [];
    }
    map[event].push(handler);
  };
  events.off = function (event, handler) {
    if (handler === undefined) {
      map[event] = [];
    } else {
      for (;;) {
        var index = map[event].indexOf(handler);
        if (index === -1) {
          break;
        }
        map[event].splice(index, 1);
      }
    }
  };
  events.emit = function (event, data) {
    if (Utils.hasOwn(map, event)) {
      map[event].forEach(function (handler) {
        handler(data);
      });
    }
  };
  return events;
};

module.exports = Events;
