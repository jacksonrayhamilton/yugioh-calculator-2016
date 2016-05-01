'use strict';

define([
  'm',
  'YC',
  'css!YC History Styles',
  'YC Persistence'
], function (m, YC) {

  YC.History = function (spec) {
    var maxEvents = 150;
    spec = spec === undefined ? {} : spec;
    var history = {};
    var events = spec.events || [];
    var app = spec.app;
    var players = spec.players;
    var timer = spec.timer;
    var undos = spec.undos;
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
    undos.on('lifePointsResetRevert', function () {
      log('lifePointsResetRevert');
    });
    timer.on('timerReset', function () {
      log('timerReset');
    });
    undos.on('timerResetRevert', function () {
      log('timerResetRevert');
    });
    players.forEach(function (player) {
      player.on('lifePointsChange', function (event) {
        log('lifePointsChange', event);
      });
    });
    undos.on('lifePointsChangeRevert', function (event) {
      log('lifePointsChangeRevert', event);
    });
    var eventView = function (event) {
      var playerId = event.id;
      var description = '';
      if (event.name === 'lifePointsChange') {
        var lifePoints = event.old + event.amount;
        description = event.old + (lifePoints > event.old ? ' + ' : ' - ') +
          Math.abs(event.amount) + ' = ' + lifePoints;
      } else if (event.name === 'lifePointsChangeRevert') {
        description = 'Life points reverted to ' + event.lifePoints;
      } else if (event.name === 'lifePointsReset') {
        description = 'Life points reset';
      } else if (event.name === 'lifePointsResetRevert') {
        description = 'Life points reset reverted';
      } else if (event.name === 'timerReset') {
        description = 'Timer reset';
      } else if (event.name === 'timerResetRevert') {
        description = 'Timer reset reverted';
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
        events.reduceRight(function (previous, event) {
          return previous.concat(m('.yc-history-row', eventView(event)));
        }, [])
      ]);
    };
    return history;
  };

  YC.PersistedHistory = function (spec) {
    spec = spec === undefined ? {} : spec;
    var persistedSpec = YC.unpersist('yc-history');
    return new YC.History(YC.assign(persistedSpec || {}, spec));
  };

});
