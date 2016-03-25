(function () {

  'use strict';

  /**
   * Abstract representation of a Yugioh match timer.
   */
  YC.Timer = function (spec) {
    var timerUpdateFrequency = 1000; // 1 second
    var matchTime = 40 * 60 * 1000;  // 40 minutes
    spec = spec || {};
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
    timer.reset = function () {
      clearTimeout(timeout);
      startTime = Date.now();
      timer.emit('timerReset');
      persist();
      tick();
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
