'use strict';

define([
  'm',
  './yc',
  'text!./icons/dice-1.svg',
  'text!./icons/dice-2.svg',
  'text!./icons/dice-3.svg',
  'text!./icons/dice-4.svg',
  'text!./icons/dice-5.svg',
  'text!./icons/dice-6.svg',
  'text!./icons/coin-heads.svg',
  'text!./icons/coin-tails.svg',
  'css!./styles/random',
  './events'
], function (m, YC, dice1Svg, dice2Svg, dice3Svg, dice4Svg, dice5Svg, dice6Svg, coinHeadsSvg, coinTailsSvg) {

  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  YC.Random = function (spec) {
    spec = spec === undefined ? {} : spec;
    var random = new YC.Events(spec);
    var dieResult;
    var coinResult;
    var handleAnimation = function (event, callback) {
      var target = event.currentTarget;
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
    };
    var rolling = false;
    var roll = function (event) {
      dieResult = getRandomInt(0, 5);
      random.emit('roll', {
        value: dieResult + 1
      });
      rolling = true;
      handleAnimation(event, function () {
        rolling = false;
      });
    };
    var flipping = false;
    var flip = function (event) {
      coinResult = getRandomInt(0, 1);
      random.emit('flip', {
        value: coinResult === 0 ? 'heads' : 'tails'
      });
      flipping = true;
      handleAnimation(event, function () {
        flipping = false;
      });
    };
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
  };

});
