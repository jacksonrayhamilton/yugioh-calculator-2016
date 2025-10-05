import m from 'mithril';
import closeSvg from './icons/close.svg?raw';

import Analytics from './analytics';
import Calc from './calc';
import Digit from './digit';
import Events from './events';
import Lp from './lp';
import Operand from './operand';
import { PersistedHistory } from './history';
import { PersistedPlayer } from './player';
import { PersistedTimer } from './timer';
import { PersistedUndos } from './undos';
import Random from './random';
import TransientTimer from './transient-timer';
import Utils from './utils';

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
  var transientTimer;
  var transientTimerTimeout;
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
      history: historyComponent,
      transientTimer: transientTimer
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
    timer.on('warningEntered', function () {
      showTransientTimer();
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
    transientTimer = new TransientTimer({
      timer: timer,
      onClose: hideTransientTimer
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

  // Show the transient timer mode
  function showTransientTimer () {
    mode = 'transientTimer';
    // Auto-hide after 10 seconds
    transientTimerTimeout = setTimeout(function () {
      hideTransientTimer();
    }, 10000);
    m.redraw();
  }

  // Hide the transient timer mode
  function hideTransientTimer () {
    if (transientTimerTimeout) {
      clearTimeout(transientTimerTimeout);
      transientTimerTimeout = null;
    }
    mode = 'calc';
    m.redraw();
  }

  app.view = function () {
    return m('.yc-layout', [
      !['calc', 'transientTimer'].includes(mode) ? [
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

export default App;
