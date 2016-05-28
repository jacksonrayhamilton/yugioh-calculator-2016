'use strict';

define([
  'm',
  './yc',
  'css!./styles/operand',
  './utils'
], function (m, YC) {

  var getZeros = (function () {
    var getZero = function () {
      return '0';
    };
    return function (n) {
      return YC.times(n, getZero);
    };
  }());

  /**
   * Abstract representation of an operand (a number) in an expression.
   */
  YC.Operand = function () {
    var operand = {};
    var values = [];
    operand.type = 'operand';
    operand.reset = function () {
      values = [];
    };
    operand.getValue = function () {
      var zeros = values.length < 2 ?
          getZeros(2) :
          getZeros(4 - values.length);
      return values.concat(zeros).join('');
    };
    operand.getNumericValue = function () {
      return parseFloat(operand.getValue());
    };
    operand.getIndex = function () {
      return values.length;
    };
    operand.insertDigit = function (digit) {
      if (values.length >= 5) {
        return;
      }
      values.push(digit);
    };
    operand.deleteLastDigit = function () {
      values.pop();
    };
    operand.view = function () {
      var value = operand.getValue();
      var index = operand.getIndex();

      var leading = value.substring(0, index);
      var trailing = value.substring(index + 1);

      // Determine the "currently selected" character in the value (the one that
      // will be highlighted to show the user his index).
      var selected = value.charAt(index);

      // Split up so we can test positions more easily.
      var digitsToElements = function (digits, selectors) {
        selectors = selectors === undefined ? function () {
          return '';
        } : selectors;
        return digits.split('').map(function (digit, digitIndex, digitStrings) {
          return m('span.yc-operand-digit' + selectors(digitIndex, digitStrings), digit);
        });
      };

      var splitDigits = function (digits) {
        return digitsToElements(digits);
      };

      var splitLeadingDigits = function (digits) {
        return digitsToElements(digits, function (digitIndex, digitStrings) {
          return digitStrings.slice(0, digitIndex + 1).every(function (digit) {
            return digit === '0';
          }) ? '.yc-operand-extra-digit' : '';
        });
      };

      var selectDigit = function (digit) {
        return m('.yc-operand-selected.yc-operand-digit', digit);
      };

      var vals = values.length;

      return m('.yc-operand', [].concat(
        splitLeadingDigits(leading),
        index < 2 && vals < 2 ? m('.yc-operand-blinker') : [],
        (index >= 2 || vals >= 2) && index < 4 ?
          selectDigit(selected) :
          splitDigits(selected),
        index === 4 ? m('.yc-operand-blinker') : [],
        splitDigits(trailing)
      ));
    };
    return operand;
  };

});
