import m from 'mithril';
import dice1Svg from './icons/dice-1.svg?raw';
import dice2Svg from './icons/dice-2.svg?raw';
import dice3Svg from './icons/dice-3.svg?raw';
import dice4Svg from './icons/dice-4.svg?raw';
import dice5Svg from './icons/dice-5.svg?raw';
import dice6Svg from './icons/dice-6.svg?raw';
import coinHeadsSvg from './icons/coin-heads.svg?raw';
import coinTailsSvg from './icons/coin-tails.svg?raw';

import Events from './events';

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Roll dice and flip coins.
function Random (spec) {
  spec = spec === undefined ? {} : spec;

  var random = new Events(spec);

  var dieResult;
  var coinResult;

  // Determine when an animation ends (so it can be stopped).
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

export default Random;
