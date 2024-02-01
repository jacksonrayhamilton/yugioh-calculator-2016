'use strict';

var m = require('mithril');

var Events = require('./events');
var Persistence = require('./persistence');
var Time = require('./time');

var timerUpdateFrequency = 1000; // 1 second
var matchTime = 45 * 60 * 1000;  // 40 minutes

// Abstract representation of a Yugioh match timer.
function Timer (spec) {
  spec = spec === undefined ? {} : spec;
  var startTime = spec.startTime;

  var timer = new Events(spec);
  var timeout;

  function getTimePassed () {
    return Date.now() - startTime;
  }

  timer.getTimeLeft = function () {
    return matchTime - getTimePassed();
  };

  timer.isInOvertime = function () {
    return getTimePassed() > matchTime;
  };

  // Update the timer display, then later, update it again.
  function tick () {
    if (!timer.isInOvertime()) {
      timeout = setTimeout(function () {
        m.redraw();
        tick();
      }, timerUpdateFrequency);
    }
  }

  // Store the current state for this timer.
  function persist () {
    Persistence.queuePersist('yc-timer', {
      startTime: startTime
    });
  }

  function restore (time) {
    clearTimeout(timeout);
    startTime = time;
    persist();
    tick();
  }

  // Set the timer to `time`.
  timer.restore = function (time) {
    restore(time);
    timer.emit('timerRestore');
  };

  // Set the timer back to its initial time.
  timer.reset = function () {
    var eventObject = {
      previous: {
        startTime: startTime
      }
    };
    restore(Date.now());
    timer.emit('timerReset', eventObject);
  };

  timer.view = function () {
    return m('.yc-timer', {onclick: timer.reset},
             timer.isInOvertime() ?
             'TIME' :
             Time.formatMs(timer.getTimeLeft()));
  };

  if (startTime === undefined) {
    // Start the timer for the first time.
    timer.reset();
  } else {
    // Restore the timer from a previous state.
    persist();
    tick();
  }

  return timer;
}

// Reanimate a persisted timer object.
function PersistedTimer (spec) {
  spec = spec === undefined ? {} : spec;
  var persistedSpec = Persistence.unpersist('yc-timer');
  if (persistedSpec) {
    return new Timer(persistedSpec);
  } else {
    return new Timer(spec);
  }
}

Timer.PersistedTimer = PersistedTimer;

module.exports = Timer;
