'use strict';

/**
 * Abstract representation of a Yugioh player.
 */
var ycMakePlayer = function (spec) {
  spec = spec === undefined ? {} : spec;
  var self = ycMakeEventEmitter();
  var id = spec.id;
  var lifePoints = spec.lifePoints === undefined ?
    8000 :
    spec.lifePoints;
  self.type = 'player';
  self.getId = function () {
    return id;
  };
  self.getLifePoints = function () {
    return lifePoints;
  };
  var persist = function () {
    ycQueuePersist('yc-player-' + id, {
      id: id,
      lifePoints: lifePoints
    });
  };
  self.lose = function (amount) {
    lifePoints -= amount;
    if (amount !== 0) {
      persist();
      self.emit('change');
    }
  };
  self.gain = function (amount) {
    lifePoints += amount;
    if (amount !== 0) {
      persist();
      self.emit('change');
    }
  };
  persist();
  return self;
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
