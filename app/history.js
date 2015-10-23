'use strict';

var ycMakeHistory = function (spec) {
  var maxEvents = 150;
  spec = spec || {};
  var history = {};
  var events = spec.events || [];
  var players = spec.players;
  var persist = function () {
    ycQueuePersist('yc-history', {
      events: events
    });
  };
  var log = function (name, event) {
    event.name = name;
    event.time = Date.now();
    events.push(event);
    if (events.length > maxEvents) {
      events = events.slice(-1 * maxEvents);
    }
    persist();
  };
  players.forEach(function (player) {
    player.on('lifePointsChange', function (event) {
      log('lifePointsChange', event);
    });
  });
  var eventView = function (event) {
    var playerId = event.id;
    var description = '';
    if (event.name === 'lifePointsChange') {
      var lifePoints = event.old + event.amount;
      description = event.old + (lifePoints > event.old ? ' + ' : ' - ') +
        Math.abs(event.amount) + ' = ' + lifePoints;
    }
    return [
      m('.yc-history-name-col', playerId !== undefined ? 'P' + (playerId + 1) : ''),
      m('.yc-history-desc-col', description),
      m('.yc-history-time-col', ycGetTimestamp(event.time))
    ];
  };
  history.view = function () {
    return m('.yc-history', [
      events.map(function (event) {
        return m('.yc-history-row', eventView(event));
      })
    ]);
  };
  return history;
};

var ycMakePersistedHistory = function (spec) {
  spec = spec || {};
  var persistedSpec = ycUnpersist('yc-history');
  return ycMakeHistory(ycAssign(persistedSpec || {}, spec));
};
