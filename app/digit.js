'use strict';

var m = require('mithril');

function Digit (spec) {
  spec = spec === undefined ? {} : spec;
  var digit = {};
  var value = spec.value;
  var operand = spec.operand;
  function insert () {
    operand.insertDigit(value);
  }
  digit.view = function () {
    return m('.yc-digit', {onclick: insert}, value);
  };
  return digit;
}

module.exports = Digit;
