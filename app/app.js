'use strict';

var m = require('mithril');
var closeSvg = require('./icons/close.svg');

var Analytics = require('./analytics');
var Calc = require('./calc');
var Digit = require('./digit');
var Events = require('./events');
var Lp = require('./lp');
var Operand = require('./operand');
var PersistedHistory = require('./history').PersistedHistory;
var PersistedPlayer = require('./player').PersistedPlayer;
var PersistedTimer = require('./timer').PersistedTimer;
var PersistedUndos = require('./undos').PersistedUndos;
var Random = require('./random');
var Utils = require('./utils');

function App (spec) {
  spec = spec === undefined ? {} : spec;
  var app = new Events();
  var element = spec.element;
  var players;
  var operand;
  var lps;
  var digits;
  var timer;
  var calc;
  var random;
  var historyComponent;
  var undos;
  var mode;
  var modes;
  function initNth () {
    operand = new Operand();
    lps = players.map(function (player) {
      return new Lp({
        player: player,
        operand: operand
      });
    });
    digits = Utils.times(10, function (n) {
      return new Digit({
        value: n,
        operand: operand
      });
    });
    calc = new Calc({
      lps: lps,
      reset: reset,
      back: back,
      operand: operand,
      digits: digits,
      timer: timer,
      randomMode: randomMode,
      historyMode: historyMode,
      undo: undo
    });
    modes = {
      calc: calc,
      random: random,
      history: historyComponent
    };
  }
  function init () {
    players = Utils.times(2, function (n) {
      return new PersistedPlayer({
        id: n
      });
    });
    timer = new PersistedTimer();
    timer.on('timerReset', function () {
      Analytics.event('Action', 'Restart Timer');
    });
    undos = new PersistedUndos({
      app: app,
      players: players,
      timer: timer
    });
    random = new Random();
    random.on('roll', function () {
      Analytics.event('Random', 'Roll Die');
    });
    random.on('flip', function () {
      Analytics.event('Random', 'Flip Coin');
    });
    historyComponent = new PersistedHistory({
      app: app,
      players: players,
      timer: timer,
      undos: undos,
      random: random
    });
    mode = 'calc';
    initNth();
  }
  function reset () {
    Analytics.event('Action', 'Reset Life Points');
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
  }
  function onKeydown (keydownEvent) {
    var keyCode = keydownEvent.keyCode;
    if (keyCode === 8) { // backspace
      keydownEvent.preventDefault(); // Don't navigate back one page.
      m.startComputation();
      operand.deleteLastDigit();
      m.endComputation();
    } else if (keyCode >= 48 && keyCode <= 57) {
      var digit = keyCode - 48;
      m.startComputation();
      operand.insertDigit(digit);
      m.endComputation();
    }
  }
  function back () {
    operand.deleteLastDigit();
  }
  function revertMode () {
    mode = 'calc';
  }
  function randomMode () {
    Analytics.event('Random', 'Show Random');
    mode = 'random';
  }
  function historyMode () {
    Analytics.event('History', 'Show History');
    mode = 'history';
  }
  function undo () {
    Analytics.event('Action', 'Undo');
    undos.undo();
  }
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
}

module.exports = App;
