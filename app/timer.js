import m from 'mithril';

import Events from './events';
import Persistence from './persistence';
import Time from './time';
import settingsSvg from './icons/settings.svg?raw';

var timerUpdateFrequency = 1000; // 1 second
var warningTime = 10 * 60 * 1000; // 10 minutes

// Get the default match time in minutes from persistence
function getDefaultMatchMinutes () {
  var persisted = Persistence.unpersist('yc-default-match-minutes');
  return persisted !== null ? persisted : 50;
}

// Abstract representation of a Yugioh match timer.
function Timer (spec) {
  spec = spec === undefined ? {} : spec;
  var startTime = spec.startTime;
  var defaultMinutes = spec.defaultMinutes !== undefined ? spec.defaultMinutes : getDefaultMatchMinutes();

  var timer = new Events(spec);
  var timeout;
  var wasInWarning = false;

  function getMatchTime () {
    return defaultMinutes * 60 * 1000;
  }

  function getTimePassed () {
    return Date.now() - startTime;
  }

  timer.getTimeLeft = function () {
    return getMatchTime() - getTimePassed();
  };

  timer.isInOvertime = function () {
    return getTimePassed() > getMatchTime();
  };

  timer.isInWarning = function () {
    var timeLeft = timer.getTimeLeft();
    return timeLeft <= warningTime && !timer.isInOvertime();
  };

  timer.shouldShowWarningIcon = function () {
    var timeLeft = timer.getTimeLeft();
    return timeLeft <= warningTime && !timer.isInOvertime();
  };

  // Update the timer display, then later, update it again.
  function tick () {
    if (!timer.isInOvertime()) {
      // Check if we just entered warning state
      var isInWarning = timer.isInWarning();
      if (isInWarning && !wasInWarning) {
        timer.emit('warningEntered');
      }
      wasInWarning = isInWarning;

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

  // Get the default match time in minutes
  timer.getDefaultMinutes = function () {
    return defaultMinutes;
  };

  // Set the default match time in minutes and reset the timer
  timer.setDefaultMinutes = function (minutes) {
    defaultMinutes = minutes;
    Persistence.queuePersist('yc-default-match-minutes', minutes);
    timer.reset();
  };

  timer.view = function () {
    var containerClass = '.yc-timer-container';
    if (timer.isInWarning()) {
      containerClass += '.yc-timer-warning';
    } else if (timer.isInOvertime()) {
      containerClass += '.yc-timer-overtime';
    }

    var content = [];
    if (timer.isInOvertime()) {
      content.push(m('.yc-timer-text', 'TIME'));
    } else {
      var timeText = Time.formatMs(timer.getTimeLeft());
      content.push(m('.yc-timer-text', timeText));
    }

    // Always render the container with both timer display and settings button
    // CSS controls visibility and layout based on orientation
    return m(containerClass, [
      m('.yc-timer.yc-timer-display', {onclick: timer.reset}, content),
      m('.yc-timer-settings.yc-icon-container', {
        onclick: function (e) {
          e.stopPropagation();
          timer.emit('settingsRequested');
        }
      }, m.trust(settingsSvg))
    ]);
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
