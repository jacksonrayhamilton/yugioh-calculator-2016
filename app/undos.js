'use strict';

var Events = require('./events');
var Persistence = require('./persistence');
var Utils = require('./utils');

var maxItems = 150;

// Stack of actions that have been taken, which can be undone.
function Undos (spec) {
  spec = spec === undefined ? {} : spec;
  var items = spec.items === undefined ? [] : spec.items;
  var app = spec.app;
  var players = spec.players;
  var timer = spec.timer;

  var undos = new Events();

  // The following listeners detect when events happen, and record them for
  // later undoing.

  app.on('lifePointsReset', function (eventObject) {
    push({
      type: 'lifePointsReset',
      players: eventObject.previous
    });
  });
  timer.on('timerReset', function (eventObject) {
    push({
      type: 'timerReset',
      timer: eventObject.previous
    });
  });
  players.forEach(function (player) {
    player.on('lifePointsChange', function (eventObject) {
      push({
        type: 'lifePointsChange',
        change: eventObject
      });
    });
  });

  // Remove old events to avoid a memory leak.
  function clean () {
    if (items.length > maxItems) {
      items = items.slice(-1 * maxItems);
    }
  }

  // Store the current state of these undos.
  function persist () {
    Persistence.queuePersist('yc-undos', {
      items: items
    });
  }

  function onChangeItems () {
    clean();
    persist();
  }

  // Add another item to undo.
  function push (item) {
    items.push(item);
    onChangeItems();
  }

  // Undo an action and remove it from the stack.
  function pop () {
    var item = items.pop();
    onChangeItems();
    return item;
  }

  undos.undo = function () {
    var last = pop();
    if (last === undefined) {
      return;
    }
    if (last.type === 'lifePointsReset') {
      players.forEach(function (player) {
        var lifePoints = Utils.find(last.players, function (lastPlayer) {
          return lastPlayer.id === player.getId();
        }).lifePoints;
        player.setLifePoints(lifePoints);
      });
      undos.emit('lifePointsResetRevert');
    } else if (last.type === 'timerReset') {
      var startTime = last.timer.startTime;
      timer.restore(startTime);
      undos.emit('timerResetRevert', {
        startTime: startTime
      });
    } else if (last.type === 'lifePointsChange') {
      var player = Utils.find(players, function (currentPlayer) {
        return last.change.id === currentPlayer.getId();
      });
      var lifePoints = last.change.old;
      player.setLifePoints(lifePoints);
      undos.emit('lifePointsChangeRevert', {
        id: player.getId(),
        lifePoints: lifePoints
      });
    }
  };

  return undos;
}

// Reanimate a persisted undos object.
function PersistedUndos (spec) {
  spec = spec === undefined ? {} : spec;
  var persistedSpec = Persistence.unpersist('yc-undos');
  return new Undos(Utils.assign(persistedSpec || {}, spec));
}

Undos.PersistedUndos = PersistedUndos;

module.exports = Undos;
