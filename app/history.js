(function () {

  'use strict';

  YC.History = function (spec) {
    var maxEvents = 150;
    spec = spec || {};
    var history = {};
    var events = spec.events || [];
    var app = spec.app;
    var players = spec.players;
    var timer = spec.timer;
    var persist = function () {
      YC.queuePersist('yc-history', {
        events: events
      });
    };
    var log = function (name, event) {
      event = event || {};
      event.name = name;
      event.time = Date.now();
      events.push(event);
      if (events.length > maxEvents) {
        events = events.slice(-1 * maxEvents);
      }
      persist();
    };
    app.on('lifePointsReset', function () {
      log('lifePointsReset');
    });
    timer.on('timerReset', function () {
      log('timerReset');
    });
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
      } else if (event.name === 'lifePointsReset') {
        description = 'Life points reset';
      } else if (event.name === 'timerReset') {
        description = 'Timer reset';
      }
      var name =
          playerId !== undefined ? 'P' + (playerId + 1) :
          m.trust('&nbsp;&nbsp;');
      return [
        m('.yc-history-name-col', name),
          m('.yc-history-desc-col', description),
          m('.yc-history-time-col', YC.getTimestamp(event.time))
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

  YC.PersistedHistory = function (spec) {
    spec = spec || {};
    var persistedSpec = YC.unpersist('yc-history');
    return new YC.History(YC.assign(persistedSpec || {}, spec));
  };

}());
