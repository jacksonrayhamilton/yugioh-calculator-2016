'use strict';

var Utils = require('./utils');

/**
 * Makes an object that can emit named events to listeners.
 */
function Events () {
  var events = {};
  var map = {};
  events.on = function (eventName, handler) {
    if (!Utils.hasOwn(map, eventName)) {
      map[eventName] = [];
    }
    map[eventName].push(handler);
  };
  events.off = function (eventName, handler) {
    if (handler === undefined) {
      map[eventName] = [];
    } else {
      for (;;) {
        var index = map[eventName].indexOf(handler);
        if (index === -1) {
          break;
        }
        map[eventName].splice(index, 1);
      }
    }
  };
  events.emit = function (eventName, data) {
    if (Utils.hasOwn(map, eventName)) {
      map[eventName].forEach(function (handler) {
        handler(data);
      });
    }
  };
  return events;
}

module.exports = Events;
