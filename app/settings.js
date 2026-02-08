import m from 'mithril';
import arrowUpSvg from './icons/arrow-up.svg?raw';
import arrowDownSvg from './icons/arrow-down.svg?raw';
import Persistence from './persistence';
import Time from './time';
import Utils from './utils';

// Settings mode for configuring application settings.
function Settings (spec) {
  spec = spec === undefined ? {} : spec;
  var timer = spec.timer;

  var settings = {};

  function increaseTime () {
    var currentMinutes = timer.getDefaultMinutes();
    var newMinutes = Math.min(60, currentMinutes + 5);
    timer.setDefaultMinutes(newMinutes);
  }

  function decreaseTime () {
    var currentMinutes = timer.getDefaultMinutes();
    var newMinutes = Math.max(30, currentMinutes - 5);
    timer.setDefaultMinutes(newMinutes);
  }

  settings.view = function () {
    var defaultMinutes = timer.getDefaultMinutes();
    var timeText = Time.formatMs(defaultMinutes * 60 * 1000);
    var isAtMax = defaultMinutes >= 60;
    var isAtMin = defaultMinutes <= 30;

    return [
      m('.yc-settings', [
        m('.yc-settings-row', [
          m('.yc-settings-label', 'Timer start:')
        ]),
        m('.yc-settings-row', [
          m('.yc-settings-value', timeText),
          m('.yc-settings-controls', [
            m('.yc-settings-button.yc-icon-container', Utils.assign({
              onclick: increaseTime
            }, isAtMax ? {disabled: ''} : {}), m.trust(arrowUpSvg)),
            m('.yc-settings-button.yc-icon-container', Utils.assign({
              onclick: decreaseTime
            }, isAtMin ? {disabled: ''} : {}), m.trust(arrowDownSvg))
          ])
        ])
      ])
    ];
  };

  return settings;
}

export default Settings;
