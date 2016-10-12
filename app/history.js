'use strict';

var m = require('mithril');

var Persistence = require('./persistence');
var Time = require('./time');
var Utils = require('./utils');

var History = function (spec) {
  var maxEvents = 150;
  spec = spec === undefined ? {} : spec;
  var history = {};
  var events = spec.events || [];
  var app = spec.app;
  var players = spec.players;
  var timer = spec.timer;
  var undos = spec.undos;
  var random = spec.random;
  var persist = function () {
    Persistence.queuePersist('yc-history', {
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
  random.on('roll', function (event) {
    log('roll', event);
  });
  random.on('flip', function (event) {
    log('flip', event);
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
    } else if (event.name === 'roll') {
      description = 'Rolled ' + event.value;
    } else if (event.name === 'flip') {
      description = 'Flipped ' + event.value;
    }
    var name =
        playerId !== undefined ? 'P' + (playerId + 1) :
        m.trust('&nbsp;&nbsp;');
    return [
      m('.yc-history-name-col', name),
      m('.yc-history-desc-col', description),
      m('.yc-history-time-col', Time.getTimestamp(event.time))
    ];
  };
  history.view = function () {
    return [
      m('.yc-history', [
        events.reduceRight(function (previous, event, index) {
          var previousEvent = events[index + 1];
          if (previousEvent && Time.startOfDay(previousEvent.time) > Time.startOfDay(event.time)) {
            // Separate days.
            previous = previous.concat(
              m('.yc-history-break', [
                m('span.yc-history-break-text', Time.getDaystamp(event.time))
              ])
            );
          }
          return previous.concat(m('.yc-history-row', eventView(event)));
        }, [])
      ])
    ];
  };
  return history;
};

var PersistedHistory = function (spec) {
  spec = spec === undefined ? {} : spec;
  var persistedSpec = Persistence.unpersist('yc-history');
  return new History(Utils.assign(persistedSpec || {}, spec));
};

History.PersistedHistory = PersistedHistory;

module.exports = History;
