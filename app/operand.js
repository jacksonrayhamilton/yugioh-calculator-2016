'use strict';

var m = require('mithril');
var Utils = require('./utils');

function getZero () {
  return '0';
}

function getZeros (n) {
  return Utils.times(n, getZero);
}

// Abstract representation of an operand (a number) in an expression.
function Operand () {
  var operand = {};

  // Numbers that will be joined to form a value to use as an operand.
  var values = [];

  // Remove all currently-entered numbers.
  operand.reset = function () {
    values = [];
  };

  // Get the current operand value as a string.
  operand.getValue = function () {
    // For the first two digits, the zeros for numbers >=100 and >=1000 are
    // automatically supplied.  Numbers where 1000 > N >= 100 are relatively
    // common, and by filling in 2 zeros, we have a fast case for entering
    // numbers in that range.  Numbers >=1000 % 100 always take at least two
    // numbers to describe, except in the >= 1000 % 1000 case, but that's less
    // common than the "not % 1000" case, so it's usually more efficient to fill
    // in 2 zeros for >=1000 too.  Afterwards, we can overwrite to accomodate
    // any other quantity.
    var zeros = values.length < 2 ?
        getZeros(2) :
        getZeros(4 - values.length);
    return values.concat(zeros).join('');
  };

  // Get the current operand value as a number.
  operand.getNumericValue = function () {
    return parseFloat(operand.getValue());
  };

  // Get the point where the next digit will be entered.
  operand.getIndex = function  () {
    return values.length;
  };

  // Insert another digit, if possible.
  operand.insertDigit = function (digit) {
    if (values.length >= 5) {
      // Values over 5 digits are practically non-existent, and are more likely
      // to break the layout due to misuse.
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
    function digitsToElements (digits, selectors) {
      selectors = selectors === undefined ? function () {
        return '';
      } : selectors;
      return digits.split('').map(function (digit, digitIndex, digitStrings) {
        return m('span.yc-operand-digit' + selectors(digitIndex, digitStrings), digit);
      });
    }

    function splitDigits (digits) {
      return digitsToElements(digits);
    }

    // Display leading digits, because the only logical way to enter "rare"
    // quanities like "150" is to pad until it's possible to overwrite digits.
    function splitLeadingDigits (digits) {
      return digitsToElements(digits, function (digitIndex, digitStrings) {
        return digitStrings.slice(0, digitIndex + 1).every(function (digit) {
          return digit === '0';
        }) ? '.yc-operand-extra-digit' : '';
      });
    }

    function selectDigit (digit) {
      return m('.yc-operand-selected.yc-operand-digit', digit);
    }

    var vals = values.length;

    // Use a blinker when a new digit will be inserted, and "select" the digit
    // when that digit will be overwritten by the next input.
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
}

module.exports = Operand;
