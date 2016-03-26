(function () {

  'use strict';

  YC.App = function (spec) {
    spec = spec === undefined ? {} : spec;
    var app = new YC.Events();
    var element = spec.element;
    var players;
    var operand;
    var lps;
    var digits;
    var timer;
    var calc;
    var history;
    var undos;
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
      undos = new YC.PersistedUndos({
        app: app,
        players: players,
        timer: timer
      });
      history = new YC.PersistedHistory({
        app: app,
        players: players,
        timer: timer,
        undos: undos
      });
      mode = 'calc';
      initNth();
    };
    var reset = function () {
      var previous = players.map(function (player) {
        return {
          id: player.getId(),
          lifePoints: player.getLifePoints()
        };
      });
      players.forEach(function (player) {
        player.reset();
      });
      app.emit('lifePointsReset', {
        previous: previous
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
    var revertMode = function () {
      mode = 'calc';
    };
    var historyMode = function () {
      mode = 'history';
    };
    var undo = function () {
      undos.undo();
    };
    app.view = function () {
      var underlineRight = mode !== 'calc' ?
          m('.yc-layout-revert', { onclick: revertMode }, 'Back') :
          [
            m('.yc-button', { onclick: historyMode }, 'H'),
            m('.yc-button', { onclick: undo }, 'U')
          ];
      return m('.yc-layout', [
        modes[mode].view(),
        m('.yc-layout-row.yc-layout-underline', [
          timer.view(),
          underlineRight
        ])
      ]);
    };
    init();
    document.addEventListener('keydown', onKeydown);
    m.mount(element, app);
    app.destroy = function () {
      document.removeEventListener('keydown', onKeydown);
      m.mount(element, null);
    };
    return app;
  };

}());
