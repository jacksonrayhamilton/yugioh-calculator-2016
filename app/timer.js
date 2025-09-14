import m from 'mithril';

import Events from './events';
import Persistence from './persistence';
import Time from './time';
import warningSvg from './icons/warning.svg?raw';

var timerUpdateFrequency = 1000; // 1 second
var matchTime = 50 * 60 * 1000;  // 50 minutes
var warningTime = 10 * 60 * 1000; // 10 minutes
var dangerTime = 5 * 60 * 1000;   // 5 minutes

// Abstract representation of a Yugioh match timer.
function Timer (spec) {
  spec = spec === undefined ? {} : spec;
  var startTime = spec.startTime;

  var timer = new Events(spec);
  var timeout;
  var flashVisible = true;

  function getTimePassed () {
    return Date.now() - startTime;
  }

  timer.getTimeLeft = function () {
    return matchTime - getTimePassed();
  };

  timer.isInOvertime = function () {
    return getTimePassed() > matchTime;
  };

  timer.isInWarning = function () {
    var timeLeft = timer.getTimeLeft();
    return timeLeft <= warningTime && timeLeft > dangerTime;
  };

  timer.isInDanger = function () {
    var timeLeft = timer.getTimeLeft();
    return timeLeft <= dangerTime && !timer.isInOvertime();
  };

  timer.shouldShowWarningIcon = function () {
    var timeLeft = timer.getTimeLeft();
    return timeLeft <= warningTime && !timer.isInOvertime();
  };

  timer.shouldFlashWarningIcon = function () {
    return timer.isInDanger() && flashVisible;
  };

  // Update the timer display, then later, update it again.
  function tick () {
    if (!timer.isInOvertime()) {
      // Toggle flash visibility for danger mode
      if (timer.isInDanger()) {
        flashVisible = !flashVisible;
      }
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
    var cssClass = '.yc-timer';
    if (timer.isInWarning()) {
      cssClass += '.yc-timer-warning';
    } else if (timer.isInDanger()) {
      cssClass += '.yc-timer-danger';
    } else if (timer.isInOvertime()) {
      cssClass += '.yc-timer-overtime';
    }

    var content = [];
    if (timer.isInOvertime()) {
      content.push(m('.yc-timer-spacer'));
      content.push(m('.yc-timer-text', 'TIME'));
      content.push(m('.yc-timer-spacer'));
    } else {
      var timeText = Time.formatMs(timer.getTimeLeft());
      // Left side: warning icon or spacer
      if (timer.shouldShowWarningIcon()) {
        // Show icon continuously in warning mode, flash only in danger mode
        var iconVisible = !timer.isInDanger() || timer.shouldFlashWarningIcon();
        if (iconVisible) {
          content.push(m('.yc-timer-warning-icon', m.trust(warningSvg)));
        } else {
          content.push(m('.yc-timer-spacer'));
        }
      } else {
        content.push(m('.yc-timer-spacer'));
      }
      // Center: countdown text
      content.push(m('.yc-timer-text', timeText));
      // Right side: dummy spacer to balance layout
      content.push(m('.yc-timer-spacer'));
    }

    return m(cssClass, {onclick: timer.reset}, content);
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
export function PersistedTimer (spec) {
  spec = spec === undefined ? {} : spec;
  var persistedSpec = Persistence.unpersist('yc-timer');
  if (persistedSpec) {
    return new Timer(persistedSpec);
  } else {
    return new Timer(spec);
  }
}

export default Timer;
