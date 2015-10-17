'use strict';

/**
 * Abstract representation of a Yugioh player.
 */
var ycMakePlayer = function (spec) {
  spec = spec === undefined ? {} : spec;
  var player = {};
  var id = spec.id;
  var lifePoints = spec.lifePoints === undefined ?
    8000 :
    spec.lifePoints;
  player.type = 'player';
  player.getId = function () {
    return id;
  };
  player.getLifePoints = function () {
    return lifePoints;
  };
  var persist = function () {
    ycQueuePersist('yc-player-' + id, {
      id: id,
      lifePoints: lifePoints
    });
  };
  player.lose = function (amount) {
    lifePoints -= amount;
    if (amount !== 0) {
      persist();
    }
  };
  player.gain = function (amount) {
    lifePoints += amount;
    if (amount !== 0) {
      persist();
    }
  };
  persist();
  return player;
};

/**
 * Reanimate a persisted player object.
 */
var makePersistedPlayer = function (spec) {
  spec = spec === undefined ? {} : spec;
  var persistedSpec = ycUnpersist('yc-player-' + spec.id);
  if (persistedSpec) {
    return ycMakePlayer(persistedSpec);
  } else {
    return ycMakePlayer(spec);
  }
};
