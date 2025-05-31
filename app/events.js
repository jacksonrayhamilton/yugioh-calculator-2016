import Utils from './utils';

// An object that can emit named events to listeners.
function Events () {
  var events = {};
  var map = {};

  // Register a handler for an event.
  events.on = function (eventName, handler) {
    if (!Utils.hasOwn(map, eventName)) {
      map[eventName] = [];
    }
    map[eventName].push(handler);
  };

  // Remove a handler for an event.
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

  // Trigger an event, passing data along.
  events.emit = function (eventName, data) {
    if (Utils.hasOwn(map, eventName)) {
      map[eventName].forEach(function (handler) {
        handler(data);
      });
    }
  };

  return events;
}

export default Events;
