'use strict';

var ycMakeApp = function () {
  var app = {};
  var players;
  var operand;
  var lps;
  var digits;
  var timer;
  var calc;
  var initFirst = function () {
    players = ycTimes(2, function (n) {
      return ycMakePersistedPlayer({
        id: n
      });
    });
    timer = ycMakePersistedTimer();
  };
  var initNth = function () {
    operand = ycMakeOperand();
    lps = players.map(function (player) {
      return ycMakeLp({
        player: player,
        operand: operand
      });
    });
    digits = ycTimes(10, function (n) {
      return ycMakeDigit({
        value: n,
        operand: operand
      });
    });
    calc = ycMakeCalc({
      lps: lps,
      cancel: cancel,
      reset: reset,
      operand: operand,
      digits: digits
    });
  };
  var init = function () {
    initFirst();
    initNth();
  };
  var reset = function () {
    players.forEach(function (player) {
      player.reset();
    });
    initNth();
  };
  var onKeydown = function (event) {
    var keyCode = event.keyCode;
    if (keyCode === 8) { // backspace
      event.preventDefault(); // Don't navigate back one page.
      m.startComputation();
      operand.deleteLastDigit();
      m.endComputation();
    } else if (keyCode >= 48 && keyCode <= 57) {
      var digit = keyCode - 48;
      m.startComputation();
      operand.insertDigit(digit);
      m.endComputation();
    }
  };
  var cancel = function () {
    operand.reset();
  };
  app.view = function () {
    return m('.yc-layout', [
      calc.view(),
      m('.yc-layout-row.yc-layout-underline', [
        timer.view(),
        m('.yc-layout-more', m.trust('&hellip;'))
      ])
    ]);
  };
  init();
  document.addEventListener('keydown', onKeydown);
  m.mount(document.body, { view: app.view });
  app.destroy = function () {
    document.removeEventListener('keydown', onKeydown);
    m.mount(document.body, null);
  };
  return app;
};
