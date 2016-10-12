'use strict';

var Events = require('./events');
var Persistence = require('./persistence');

var defaultLifePoints = 8000;

// These bounds are good for this application because there is only so much
// room in the UI to fit the numbers.
var maxLifePoints = 99999;
var minLifePoints = -9999;

/**
 * Abstract representation of a Yugioh player.
 */
var Player = function (spec) {
  spec = spec === undefined ? {} : spec;
  var player = new Events(spec);
  var id = spec.id;
  var lifePoints = spec.lifePoints === undefined ?
      defaultLifePoints :
      spec.lifePoints;
  player.type = 'player';
  player.getId = function () {
    return id;
  };
  player.getLifePoints = function () {
    return lifePoints;
  };
  player.setLifePoints = function (_lifePoints) {
    if (lifePoints !== _lifePoints) {
      persist(); // eslint-disable-line no-use-before-define
    }
    lifePoints = _lifePoints;
  };
  player.areLifePointsDefault = function () {
    return lifePoints === defaultLifePoints;
  };
  var persist = function () {
    Persistence.queuePersist('yc-player-' + id, {
      id: id,
      lifePoints: lifePoints
    });
  };
  var gain = function (amount) {
    var oldLifePoints = lifePoints;
    lifePoints += amount;
    lifePoints = Math.min(lifePoints, maxLifePoints);
    lifePoints = Math.max(lifePoints, minLifePoints);
    if (amount !== 0) {
      player.emit('lifePointsChange', {
        id: id,
        old: oldLifePoints,
        amount: amount
      });
      persist();
    }
  };
  player.lose = function (amount) {
    gain(-1 * amount);
  };
  player.gain = function (amount) {
    gain(amount);
  };
  player.reset = function () {
    lifePoints = defaultLifePoints;
    persist();
  };
  persist();
  return player;
};

/**
 * Reanimate a persisted player object.
 */
var PersistedPlayer = function (spec) {
  spec = spec === undefined ? {} : spec;
  var persistedSpec = Persistence.unpersist('yc-player-' + spec.id);
  if (persistedSpec) {
    return new Player(persistedSpec);
  } else {
    return new Player(spec);
  }
};

Player.PersistedPlayer = PersistedPlayer;

module.exports = Player;
