'use strict';

var Events = require('./events');
var Persistence = require('./persistence');
var Utils = require('./utils');

function Undos (spec) {
  var maxItems = 150;
  spec = spec === undefined ? {} : spec;
  var undos = new Events();
  var items = spec.items === undefined ? [] : spec.items;
  var app = spec.app;
  var players = spec.players;
  var timer = spec.timer;
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
  function clean () {
    if (items.length > maxItems) {
      items = items.slice(-1 * maxItems);
    }
  }
  function persist () {
    Persistence.queuePersist('yc-undos', {
      items: items
    });
  }
  function onChangeItems () {
    clean();
    persist();
  }
  function push (item) {
    items.push(item);
    onChangeItems();
  }
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

function PersistedUndos (spec) {
  spec = spec === undefined ? {} : spec;
  var persistedSpec = Persistence.unpersist('yc-undos');
  return new Undos(Utils.assign(persistedSpec || {}, spec));
}

Undos.PersistedUndos = PersistedUndos;

module.exports = Undos;
