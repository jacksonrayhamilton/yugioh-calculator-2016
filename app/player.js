import Events from './events';
import Persistence from './persistence';

var defaultLifePoints = 8000;

// These bounds are good for this application because there is only so much
// room in the UI to fit the numbers.
var maxLifePoints = 99999;
var minLifePoints = -9999;

// Abstract representation of a Yugioh player.
function Player (spec) {
  spec = spec === undefined ? {} : spec;
  var id = spec.id;
  var lifePoints = spec.lifePoints === undefined ?
      defaultLifePoints :
      spec.lifePoints;

  var player = new Events(spec);

  player.getId = function () {
    return id;
  };

  player.getLifePoints = function () {
    return lifePoints;
  };

  player.setLifePoints = function (_lifePoints) {
    if (lifePoints !== _lifePoints) {
      persist();
    }
    lifePoints = _lifePoints;
  };

  player.areLifePointsDefault = function () {
    return lifePoints === defaultLifePoints;
  };

  // Store the current state for this player.
  function persist () {
    Persistence.queuePersist('yc-player-' + id, {
      id: id,
      lifePoints: lifePoints
    });
  }

  // Change life points (add or substract).
  function gain (amount) {
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
  }

  // Lose life points.
  player.lose = function (amount) {
    gain(-1 * amount);
  };

  // Gain life points.
  player.gain = function (amount) {
    gain(amount);
  };

  // Reset a player's life points.
  player.reset = function () {
    lifePoints = defaultLifePoints;
    persist();
  };

  // Record the initial state.
  persist();

  return player;
}

// Reanimate a persisted player object.
export function PersistedPlayer (spec) {
  spec = spec === undefined ? {} : spec;
  var persistedSpec = Persistence.unpersist('yc-player-' + spec.id);
  if (persistedSpec) {
    return new Player(persistedSpec);
  } else {
    return new Player(spec);
  }
}

export default Player;
