import m from 'mithril';
import resetSvg from './icons/reset.svg?raw';
import backspaceSvg from './icons/backspace.svg?raw';
import dieSvg from './icons/dice-5.svg?raw';
import bookSvg from './icons/book.svg?raw';
import undoSvg from './icons/undo.svg?raw';

import Utils from './utils';

// Manipulate player life points.
function Calc (spec) {
  spec = spec === undefined ? {} : spec;
  var lps = spec.lps;
  var timer = spec.timer;
  var reset = spec.reset;
  var back = spec.back;
  var randomMode = spec.randomMode;
  var historyMode = spec.historyMode;
  var undo = spec.undo;
  var operand = spec.operand;
  var digits = spec.digits;

  var calc = {};

  calc.view = function () {
    return [
      lps.map(function (lp) {
        return lp.view();
      }),
      m('.yc-layout-row.yc-layout-status.yc-layout-status-calc', [
        timer.view(),
        m('.yc-layout-operand-table', [
          m('.yc-layout-operand-cell', [
            operand.view()
          ])
        ])
      ]),
      m('.yc-layout-row.yc-layout-functions', [
        m('.yc-button.yc-icon-container.yc-reset-button', {onclick: reset}, m.trust(resetSvg)),
        m('.yc-button.yc-icon-container.yc-back-button', {onclick: back}, m.trust(backspaceSvg)),
        m('.yc-button.yc-icon-container.yc-random-button', {onclick: randomMode}, m.trust(dieSvg)),
        m('.yc-button.yc-icon-container.yc-undo-button', {onclick: undo}, m.trust(undoSvg)),
        m('.yc-button.yc-icon-container.yc-history-button', {onclick: historyMode}, m.trust(bookSvg))
      ]),
      Utils.times(2, function (n) {
        var someDigits = digits.slice(n * 5, (n * 5) + 5);
        var views = someDigits.map(function (digit) {
          return digit.view();
        });
        return m('.yc-layout-row.yc-layout-digits', views);
      })
    ];
  };

  return calc;
}

export default Calc;
