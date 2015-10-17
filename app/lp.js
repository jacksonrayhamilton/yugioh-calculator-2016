'use strict';

var ycMakeLp = function (spec) {
  spec = spec === undefined ? {} : spec;
  var lp = {};
  var player = spec.player;
  var operand = spec.operand;
  lp.type = 'lp';
  var gain = function () {
    player.gain(operand.getNumericValue());
    operand.clear();
  };
  var lose = function () {
    player.lose(operand.getNumericValue());
    operand.clear();
  };
  lp.view = function () {
    return m('.yc-lp', [
      m('.yc-lp-val', player.getLifePoints()),
      m('.yc-lp-gain', { onclick: gain }, '+'),
      m('.yc-lp-lose', { onclick: lose }, '-')
    ]);
  };
  return lp;
};
