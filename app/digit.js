'use strict';

define([
  'm',
  './yc',
  'css!./digit.css'
], function (m, YC) {

  YC.Digit = function (spec) {
    spec = spec === undefined ? {} : spec;
    var digit = {};
    var value = spec.value;
    var operand = spec.operand;
    var insert = function () {
      operand.insertDigit(value);
    };
    digit.view = function () {
      return m('.yc-digit', {onclick: insert}, value);
    };
    return digit;
  };

});
