(function () {

  'use strict';

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
      var zeros;
      if (values.length === 0) {
        return '00';
      } else if (values.length === 1) {
        if (values[0] === 0) {
          return '00';
        } else {
          zeros = getZeros(2);
          return values.concat(zeros).join('');
        }
      } else if (values.length >= 2) {
        if (values.length === 2 &&
            values[0] === 0 &&
            values[1] === 0) {
          return '00';
        } else {
          zeros = getZeros(4 - values.length);
          return values.concat(zeros).join('');
        }
      }
    };
    operand.getNumericValue = function () {
      return parseFloat(operand.getValue());
    };
    operand.getIndex = function () {
      if (values.length === 0) {
        return 0;
      } else if (values.length === 1) {
        if (values[0] === 0) {
          return 0;
        } else {
          return 1;
        }
      } else if (values.length >= 2) {
        if (values.length === 2 &&
            values[0] === 0 &&
            values[1] === 0) {
          return 0;
        } else {
          return values.length;
        }
      }
    };
    operand.insertDigit = function (digit) {
      values.push(digit);
    };
    operand.deleteLastDigit = function () {
      values.pop();
    };
    operand.view = function () {
      var value = operand.getValue();
      var index = operand.getIndex();

      var leading = value.substring(0, index)
        .replace(/^0+/, '');
      var trailing = value.substring(index + 1);

      // Determine the "currently selected" character in the value (the one that
      // will be highlighted to show the user his index).
      var selected = value.charAt(index);

      // Split up so we can test positions more easily.
      var splitDigits = function (digits) {
        return digits.split('').map(function (digit) {
          return m('span', digit);
        });
      };

      var vals = values.length;

      return m('.yc-operand', [].concat(
        splitDigits(leading),
        index < 2 && vals < 2 ? m('.yc-operand-blinker') : [],
        (index >= 2 || vals >= 2) && index < 4 ?
          m('.yc-operand-selected', selected) :
          splitDigits(selected),
        index >= 4 ? m('.yc-operand-blinker') : [],
        splitDigits(trailing)
      ));
    };
    return operand;
  };

}());
