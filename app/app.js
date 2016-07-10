'use strict';

define([
  'm',
  './yc',
  'text!./icons/close.svg',
  './events',
  './operand',
  './lp',
  './digit',
  './calc',
  './player',
  './timer',
  './undos',
  './random',
  './history',
  './utils'
], function (m, YC, closeSvg) {

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
    var random;
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
        reset: reset, // eslint-disable-line no-use-before-define
        back: back, // eslint-disable-line no-use-before-define
        operand: operand,
        digits: digits,
        timer: timer,
        randomMode: randomMode, // eslint-disable-line no-use-before-define
        historyMode: historyMode, // eslint-disable-line no-use-before-define
        undo: undo // eslint-disable-line no-use-before-define
      });
      modes = {
        calc: calc,
        random: random,
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
      random = new YC.Random();
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
      var areAllPlayersDefault = players.every(function (player) {
        return player.areLifePointsDefault();
      });
      if (areAllPlayersDefault) {
        // Don't uselessly reset (it clutters the history).
        return;
      }
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
    var back = function () {
      operand.deleteLastDigit();
    };
    var revertMode = function () {
      mode = 'calc';
    };
    var randomMode = function () {
      mode = 'random';
    };
    var historyMode = function () {
      mode = 'history';
    };
    var undo = function () {
      undos.undo();
    };
    app.view = function () {
      return m('.yc-layout', [
        mode !== 'calc' ? [
          m('.yc-layout-row.yc-layout-status', [
            timer.view(),
            m('.yc-close.yc-icon-container', {onclick: revertMode}, m.trust(closeSvg))
          ]),
        ] : [],
        modes[mode].view()
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

});
