'use strict';

var ycGetZeros = (function () {
  var getZero = function () {
    return '0';
  };
  return function (n) {
    return ycTimes(n, getZero);
  };
}());

/**
 * Abstract representation of an operand (a number) in an expression.
 */
var ycMakeOperand = function () {
  var operand = {};
  var values = [];
  operand.type = 'operand';
  operand.getValue = function () {
    var zeros;
    if (values.length === 0) {
      return '00';
    } else if (values.length === 1) {
      if (values[0] === 0) {
        return '00';
      } else {
        zeros = ycGetZeros(2);
        return values.concat(zeros).join('');
      }
    } else if (values.length >= 2) {
      if (values.length === 2 &&
          values[0] === 0 &&
          values[1] === 0) {
        return '00';
      } else {
        zeros = ycGetZeros(4 - values.length);
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
  return operand;
};
