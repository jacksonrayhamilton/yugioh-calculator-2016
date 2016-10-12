'use strict';

var Events = require('./events');
var Persistence = require('./persistence');
var Utils = require('./utils');

var Undos = function (spec) {
  var maxItems = 150;
  spec = spec === undefined ? {} : spec;
  var undos = new Events();
  var items = spec.items === undefined ? [] : spec.items;
  var app = spec.app;
  var players = spec.players;
  var timer = spec.timer;
  app.on('lifePointsReset', function (event) {
    // eslint-disable-next-line no-use-before-define
    push({
      type: 'lifePointsReset',
      players: event.previous
    });
  });
  timer.on('timerReset', function (event) {
    // eslint-disable-next-line no-use-before-define
    push({
      type: 'timerReset',
      timer: event.previous
    });
  });
  players.forEach(function (player) {
    player.on('lifePointsChange', function (event) {
      // eslint-disable-next-line no-use-before-define
      push({
        type: 'lifePointsChange',
        change: event
      });
    });
  });
  var clean = function () {
    if (items.length > maxItems) {
      items = items.slice(-1 * maxItems);
    }
  };
  var persist = function () {
    Persistence.queuePersist('yc-undos', {
      items: items
    });
  };
  var onChangeItems = function () {
    clean();
    persist();
  };
  var push = function (item) {
    items.push(item);
    onChangeItems();
  };
  var pop = function () {
    var item = items.pop();
    onChangeItems();
    return item;
  };
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
};

var PersistedUndos = function (spec) {
  spec = spec === undefined ? {} : spec;
  var persistedSpec = Persistence.unpersist('yc-undos');
  return new Undos(Utils.assign(persistedSpec || {}, spec));
};

Undos.PersistedUndos = PersistedUndos;

module.exports = Undos;
