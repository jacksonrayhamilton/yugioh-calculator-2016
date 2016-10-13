'use strict';

var m = require('mithril');
var dice1Svg = require('./icons/dice-1.svg');
var dice2Svg = require('./icons/dice-2.svg');
var dice3Svg = require('./icons/dice-3.svg');
var dice4Svg = require('./icons/dice-4.svg');
var dice5Svg = require('./icons/dice-5.svg');
var dice6Svg = require('./icons/dice-6.svg');
var coinHeadsSvg = require('./icons/coin-heads.svg');
var coinTailsSvg = require('./icons/coin-tails.svg');

var Events = require('./events');

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Random (spec) {
  spec = spec === undefined ? {} : spec;
  var random = new Events(spec);
  var dieResult;
  var coinResult;
  function handleAnimation (clickEvent, callback) {
    var target = clickEvent.currentTarget;
    var ended = false;
    var onAnimationEnd = function () {
      if (ended) {
        return;
      }
      ended = true;
      callback();
      m.redraw();
      target.removeEventListener('webkitAnimationEnd', onAnimationEnd);
      target.removeEventListener('animationend', onAnimationEnd);
    };
    target.addEventListener('webkitAnimationEnd', onAnimationEnd);
    target.addEventListener('animationend', onAnimationEnd);
  }
  var rolling = false;
  function roll (clickEvent) {
    dieResult = getRandomInt(0, 5);
    random.emit('roll', {
      value: dieResult + 1
    });
    rolling = true;
    handleAnimation(clickEvent, function () {
      rolling = false;
    });
  }
  var flipping = false;
  function flip (clickEvent) {
    coinResult = getRandomInt(0, 1);
    random.emit('flip', {
      value: coinResult === 0 ? 'heads' : 'tails'
    });
    flipping = true;
    handleAnimation(clickEvent, function () {
      flipping = false;
    });
  }
  random.view = function () {
    return [
      m('.yc-random', [
        m('.yc-random-cell.yc-icon-container', {onclick: roll},
          dieResult === undefined ?
          'Roll' :
          m('.yc-icon-container' + (rolling ? '.yc-pulsate' : ''),
            dieResult === 0 ? m.trust(dice1Svg) :
            dieResult === 1 ? m.trust(dice2Svg) :
            dieResult === 2 ? m.trust(dice3Svg) :
            dieResult === 3 ? m.trust(dice4Svg) :
            dieResult === 4 ? m.trust(dice5Svg) :
            dieResult === 5 ? m.trust(dice6Svg) :
            undefined)),
        m('.yc-random-cell.yc-icon-container', {onclick: flip},
          coinResult === undefined ?
          'Flip' :
          m('.yc-icon-container' + (flipping ? '.yc-pulsate' : ''),
            coinResult === 0 ? m.trust(coinHeadsSvg) :
            coinResult === 1 ? m.trust(coinTailsSvg) :
            undefined))
      ])
    ];
  };
  return random;
}

module.exports = Random;
