(function () {

  'use strict';

  YC.App = function () {
    var app = new YC.Events();
    var players;
    var operand;
    var lps;
    var digits;
    var timer;
    var calc;
    var more;
    var history;
    var mode;
    var modes;
    var initNth = function () {
      operand = new YC.Operand();
      lps = players.map(function (player) {
        return new YC.Lp({
          player: player,
          operand: operand
        });
      });
      digits = YC.times(10, function (n) {
        return new YC.Digit({
          value: n,
          operand: operand
        });
      });
      calc = new YC.Calc({
        lps: lps,
        cancel: cancel,
        reset: reset,
        operand: operand,
        digits: digits
      });
      modes = {
        calc: calc,
        more: more,
        history: history
      };
    };
    var init = function () {
      players = YC.times(2, function (n) {
        return new YC.PersistedPlayer({
          id: n
        });
      });
      timer = new YC.PersistedTimer();
      more = new YC.More({
        setMode: function (name) {
          mode = name;
        }
      });
      history = new YC.PersistedHistory({
        app: app,
        players: players,
        timer: timer
      });
      mode = 'calc';
      initNth();
    };
    var reset = function () {
      players.forEach(function (player) {
        player.reset();
      });
      app.emit('lifePointsReset');
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
    var toggleMode = function () {
      if ((mode !== 'calc' && mode !== 'more') || mode === 'calc') {
        // Toggle or return to the "more" mode.
        mode = 'more';
      } else {
        mode = 'calc';
      }
    };
    app.view = function () {
      var toggleText = mode !== 'calc' ? 'Back' : m.trust('&hellip;');
      return m('.yc-layout', [
        modes[mode].view(),
        m('.yc-layout-row.yc-layout-underline', [
          timer.view(),
          m('.yc-layout-toggle', { onclick: toggleMode }, toggleText)
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

}());
