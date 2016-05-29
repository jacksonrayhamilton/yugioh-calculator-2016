'use strict';

define([
  'm',
  './yc',
  'text!./icons/reset.svg',
  'text!./icons/backspace.svg',
  'text!./icons/book.svg',
  'text!./icons/undo.svg'
], function (m, YC, resetSvg, backspaceSvg, bookSvg, undoSvg) {

  YC.Calc = function (spec) {
    spec = spec === undefined ? {} : spec;
    var calc = {};
    var lps = spec.lps;
    var timer = spec.timer;
    var reset = spec.reset;
    var cancel = spec.cancel;
    var back = spec.back;
    var historyMode = spec.historyMode;
    var undo = spec.undo;
    var operand = spec.operand;
    var digits = spec.digits;
    calc.view = function () {
      return [
        lps.map(function (lp) {
          return lp.view();
        }),
        m('.yc-layout-row.yc-layout-status', [
          timer.view(),
          m('.yc-layout-operand-table', [
            m('.yc-layout-operand-cell', [
              operand.view()
            ])
          ])
        ]),
        m('.yc-layout-row.yc-layout-functions', [
          m('.yc-button.yc-icon-container.yc-reset-button', {onclick: reset}, m.trust(resetSvg)),
          m('.yc-button.yc-cancel-button', {onclick: cancel}, 'C'),
          m('.yc-button.yc-icon-container.yc-back-button', {onclick: back}, m.trust(backspaceSvg)),
          m('.yc-button.yc-icon-container.yc-undo-button', {onclick: undo}, m.trust(undoSvg)),
          m('.yc-button.yc-icon-container.yc-history-button', {onclick: historyMode}, m.trust(bookSvg))
        ]),
        YC.times(2, function (n) {
          var someDigits = digits.slice(n * 5, (n * 5) + 5);
          var views = someDigits.map(function (digit) {
            return digit.view();
          });
          return m('.yc-layout-row.yc-layout-digits', views);
        })
      ];
    };
    return calc;
  };

});
