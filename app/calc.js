'use strict';

define([
  'm',
  './yc'
], function (m, YC) {

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
            m('.yc-layout-operand-spacer'),
            m('.yc-layout-operand-cell', [
              m('.yc-layout-operand-anchor', [
                // Center some text to position the operand relative to the "right
                // edge" of the below digit.
                m.trust('&nbsp;'),
                operand.view()
              ])
            ])
          ])

        ]),
        m('.yc-layout-row.yc-layout-functions', [
          m('.yc-button.yc-reset-button', {onclick: reset}, 'R'),
          m('.yc-button.yc-cancel-button', {onclick: cancel}, 'C'),
          m('.yc-button.yc-back-button', {onclick: back}, 'B'),
          m('.yc-button.yc-history-button', {onclick: historyMode}, 'H'),
          m('.yc-button.yc-undo-button', {onclick: undo}, 'U')
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
