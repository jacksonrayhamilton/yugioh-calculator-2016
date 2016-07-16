'use strict';

define([
  'm',
  './yc',
  'text!./icons/plus.svg',
  'text!./icons/minus.svg',
  'css!./styles/lp',
  './analytics'
], function (m, YC, plusSvg, minusSvg) {

  YC.Lp = function (spec) {
    spec = spec === undefined ? {} : spec;
    var lp = {};
    var player = spec.player;
    var operand = spec.operand;
    lp.type = 'lp';
    var gain = function () {
      YC.Analytics.event('Action', 'Add');
      player.gain(operand.getNumericValue());
      operand.reset();
    };
    var lose = function () {
      YC.Analytics.event('Action', 'Subtract');
      player.lose(operand.getNumericValue());
      operand.reset();
    };
    lp.view = function () {
      return m('.yc-lp', [
        m('.yc-lp-val', player.getLifePoints()),
        m('.yc-lp-gain.yc-icon-container', {onclick: gain}, m.trust(plusSvg)),
        m('.yc-lp-lose.yc-icon-container', {onclick: lose}, m.trust(minusSvg))
      ]);
    };
    return lp;
  };

});
