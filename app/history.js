'use strict';

var m = require('mithril');

var Persistence = require('./persistence');
var Time = require('./time');
var Utils = require('./utils');

var maxEvents = 150;

// View all the actions that been executed on each player's life points.
function HistoryComponent (spec) {
  spec = spec === undefined ? {} : spec;
  var events = spec.events || [];
  var app = spec.app;
  var players = spec.players;
  var timer = spec.timer;
  var undos = spec.undos;
  var random = spec.random;

  var historyComponent = {};

  // Store the current history state.
  function persist () {
    Persistence.queuePersist('yc-history', {
      events: events
    });
  }

  // Record an event, removing old ones if there are too many.
  function log (eventName, eventObject) {
    eventObject = eventObject || {};
    eventObject.name = eventName;
    eventObject.time = Date.now();
    events.push(eventObject);
    if (events.length > maxEvents) {
      events = events.slice(-1 * maxEvents);
    }
    persist();
  }

  // The following listeners detect when events occur throughout the
  // application, and record them.

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
    player.on('lifePointsChange', function (eventObject) {
      log('lifePointsChange', eventObject);
    });
  });
  undos.on('lifePointsChangeRevert', function (eventObject) {
    log('lifePointsChangeRevert', eventObject);
  });
  random.on('roll', function (eventObject) {
    log('roll', eventObject);
  });
  random.on('flip', function (eventObject) {
    log('flip', eventObject);
  });

  function eventView (eventObject) {
    var playerId = eventObject.id;
    var description = '';
    if (eventObject.name === 'lifePointsChange') {
      var lifePoints = eventObject.old + eventObject.amount;
      description = eventObject.old + (lifePoints > eventObject.old ? ' + ' : ' - ') +
        Math.abs(eventObject.amount) + ' = ' + lifePoints;
    } else if (eventObject.name === 'lifePointsChangeRevert') {
      description = 'Life points reverted to ' + eventObject.lifePoints;
    } else if (eventObject.name === 'lifePointsReset') {
      description = 'Life points reset';
    } else if (eventObject.name === 'lifePointsResetRevert') {
      description = 'Life points reset reverted';
    } else if (eventObject.name === 'timerReset') {
      description = 'Timer reset';
    } else if (eventObject.name === 'timerResetRevert') {
      description = 'Timer reset reverted';
    } else if (eventObject.name === 'roll') {
      description = 'Rolled ' + eventObject.value;
    } else if (eventObject.name === 'flip') {
      description = 'Flipped ' + eventObject.value;
    }
    var playerName =
        playerId !== undefined ? 'P' + (playerId + 1) :
        m.trust('&nbsp;&nbsp;');
    return [
      m('.yc-history-name-col', playerName),
      m('.yc-history-desc-col', description),
      m('.yc-history-time-col', Time.getTimestamp(eventObject.time))
    ];
  }

  historyComponent.view = function () {
    return [
      m('.yc-history', [
        events.reduceRight(function (previous, eventObject, index) {
          var previousEvent = events[index + 1];
          if (previousEvent && Time.startOfDay(previousEvent.time) > Time.startOfDay(eventObject.time)) {
            // Separate days.
            previous = previous.concat(
              m('.yc-history-break', [
                m('span.yc-history-break-text', Time.getDaystamp(eventObject.time))
              ])
            );
          }
          var playerId = eventObject.id;
          var playerIdSelector =
              playerId !== undefined ? '.yc-history-row-p' + (playerId + 1) :
              '';
          return previous.concat(m('.yc-history-row' + playerIdSelector, eventView(eventObject)));
        }, [])
      ])
    ];
  };

  return historyComponent;
}

// Reanimate a persisted history object.
function PersistedHistory (spec) {
  spec = spec === undefined ? {} : spec;
  var persistedSpec = Persistence.unpersist('yc-history');
  return new HistoryComponent(Utils.assign(persistedSpec || {}, spec));
}

HistoryComponent.PersistedHistory = PersistedHistory;

module.exports = HistoryComponent;
