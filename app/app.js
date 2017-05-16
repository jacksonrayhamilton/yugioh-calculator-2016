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

// Application UI and state container.
function App (spec) {
  spec = spec === undefined ? {} : spec;

  var app = new Events();
  var element = spec.element;

  // State variables.
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

  // Set the application to its initial state for the Nth time (for the first
  // time, and when the user resets the application state).
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

  // Initialize the application for the first time, restoring relevant previous
  // state from disk.
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

  // Reset each player's life points, and reset the application state.
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

  // Add keyboard support for desktop users.
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

  // Handler for the "Back" button.
  function back () {
    operand.deleteLastDigit();
  }

  // Go back to the default "mode" (which is for entering numbers).
  function revertMode () {
    mode = 'calc';
  }

  // Go to the "random" mode, where coins can be flipped and dice can be rolled.
  function randomMode () {
    Analytics.event('Random', 'Show Random');
    mode = 'random';
  }

  // Go to the "history" mode, where all actions taken with the calculator are
  // recorded and displayed by time and day.
  function historyMode () {
    Analytics.event('History', 'Show History');
    mode = 'history';
  }

  // Undo the previous action.
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
  // Register service worker to enable offline access
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('sw.js');
  }

  return app;
}

module.exports = App;
