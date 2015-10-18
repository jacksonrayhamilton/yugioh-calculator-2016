'use strict';

/**
 * Abstract representation of a Yugioh match timer.
 */
var makeTimer = function (spec) {
  var timerUpdateFrequency = 1000; // 1 second
  var matchTime = 40 * 60 * 1000;  // 40 minutes
  spec = spec === undefined ? {} : spec;
  var timer = {};
  var startTime = spec.startTime;
  var timeout;
  var getTimePassed = function () {
    return Date.now() - startTime;
  };
  timer.getTimeLeft = function () {
    return matchTime - getTimePassed();
  };
  timer.isInOvertime = function () {
    return getTimePassed() > matchTime;
  };
  var tick = function () {
    if (!timer.isInOvertime()) {
      timeout = setTimeout(function () {
        m.redraw();
        tick();
      }, timerUpdateFrequency);
    }
  };
  var persist = function () {
    ycQueuePersist('yc-timer', {
      startTime: startTime
    });
  };
  timer.reset = function () {
    clearTimeout(timeout);
    startTime = Date.now();
    persist();
    tick();
  };
  timer.view = function () {
    return m('.yc-timer', { onclick: timer.reset },
             timer.isInOvertime() ?
             'TIME' :
             ycFormatMs(timer.getTimeLeft()));
  };
  if (startTime === undefined) {
    timer.reset();
  } else {
    persist();
    tick();
  }
  return timer;
};

/**
 * Reanimate a persisted timer object.
 */
var ycMakePersistedTimer = function (spec) {
  spec = spec === undefined ? {} : spec;
  var persistedSpec = ycUnpersist('yc-timer');
  if (persistedSpec) {
    return makeTimer(persistedSpec);
  } else {
    return makeTimer(spec);
  }
};
