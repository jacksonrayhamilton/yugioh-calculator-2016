import m from 'mithril';
import warningSvg from './icons/warning.svg?raw';
import closeSvg from './icons/close.svg?raw';
import Time from './time';

function TransientTimer (spec) {
  spec = spec === undefined ? {} : spec;
  var timer = spec.timer;
  var onClose = spec.onClose;

  var transientTimer = {};

  transientTimer.view = function () {
    var timeText = timer.isInOvertime() ? 'TIME' : Time.formatMs(timer.getTimeLeft());

    return m('.yc-transient-timer', [
      m('.yc-transient-timer-icon', m.trust(warningSvg)),
      m('.yc-transient-timer-time', timeText),
      m('.yc-transient-timer-close', {onclick: onClose}, m.trust(closeSvg))
    ]);
  };

  return transientTimer;
}

export default TransientTimer;
