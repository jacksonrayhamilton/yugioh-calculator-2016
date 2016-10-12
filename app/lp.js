'use strict';

var m = require('mithril');
var plusSvg = require('./icons/plus.svg');
var minusSvg = require('./icons/minus.svg');

var Analytics = require('./analytics');

var Lp = function (spec) {
  spec = spec === undefined ? {} : spec;
  var lp = {};
  var player = spec.player;
  var operand = spec.operand;
  lp.type = 'lp';
  var gain = function () {
    Analytics.event('Action', 'Add');
    player.gain(operand.getNumericValue());
    operand.reset();
  };
  var lose = function () {
    Analytics.event('Action', 'Subtract');
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

module.exports = Lp;
