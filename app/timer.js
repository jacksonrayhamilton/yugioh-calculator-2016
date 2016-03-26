(function () {

  'use strict';

  /**
   * Abstract representation of a Yugioh match timer.
   */
  YC.Timer = function (spec) {
    var timerUpdateFrequency = 1000; // 1 second
    var matchTime = 40 * 60 * 1000;  // 40 minutes
    spec = spec === undefined ? {} : spec;
    var timer = new YC.Events(spec);
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
      YC.queuePersist('yc-timer', {
        startTime: startTime
      });
    };
    var restore = function (time) {
      clearTimeout(timeout);
      startTime = time;
      persist();
      tick();
    };
    timer.restore = function (time) {
      restore(time);
      timer.emit('timerRestore');
    };
    timer.reset = function () {
      var event = {
        previous: {
          startTime: startTime
        }
      };
      restore(Date.now());
      timer.emit('timerReset', event);
    };
    timer.view = function () {
      return m('.yc-timer', { onclick: timer.reset },
               timer.isInOvertime() ?
               'TIME' :
               YC.formatMs(timer.getTimeLeft()));
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
  YC.PersistedTimer = function (spec) {
    spec = spec === undefined ? {} : spec;
    var persistedSpec = YC.unpersist('yc-timer');
    if (persistedSpec) {
      return new YC.Timer(persistedSpec);
    } else {
      return new YC.Timer(spec);
    }
  };

}());
