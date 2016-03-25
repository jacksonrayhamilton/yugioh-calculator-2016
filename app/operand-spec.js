'use strict';

describe('operand', function () {
  var matchers = {};
  matchers.toHaveThingAt = function () {
    var matcher = {};
    matcher.compare = function (operand, thing, expected) {
      var result = {};
      result.pass = false;
      var view = operand.view();
      var actual = -1;
      var isThing = function (child) {
        return typeof child === 'object' &&
          child.attrs.className === thing;
      };
      view.children.some(function (child, index) {
        if (isThing(child)) {
          actual = index;
          return true;
        }
      });
      result.pass = actual === expected;
      if (result.pass) {
        result.message = 'Expected operand not to have a ' + thing + ' at ' + expected;
      } else {
        result.message = 'Expected operand to have a ' + thing + ' at ' + expected + ', but it was at ' + actual;
      }
      return result;
    };
    return matcher;
  };
  beforeEach(function () {
    jasmine.addMatchers(matchers);
  });
  it('should build up values', function () {
    var operand = new YC.Operand();
    expect(operand.getValue()).toBe('00');
    operand.insertDigit(1);
    expect(operand.getValue()).toBe('100');
    operand.insertDigit(2);
    expect(operand.getValue()).toBe('1200');
    operand.insertDigit(3);
    expect(operand.getValue()).toBe('1230');
  });
  it('should transition from blinker to selected to blinker', function () {
    var operand = new YC.Operand();
    expect(operand).toHaveThingAt('yc-operand-blinker', 0);
    expect(operand).toHaveThingAt('yc-operand-selected', -1);
    operand.insertDigit(1);
    expect(operand).toHaveThingAt('yc-operand-blinker', 1);
    expect(operand).toHaveThingAt('yc-operand-selected', -1);
    operand.insertDigit(2);
    expect(operand).toHaveThingAt('yc-operand-blinker', -1);
    expect(operand).toHaveThingAt('yc-operand-selected', 2);
    operand.insertDigit(3);
    expect(operand).toHaveThingAt('yc-operand-blinker', -1);
    expect(operand).toHaveThingAt('yc-operand-selected', 3);
    operand.insertDigit(4);
    expect(operand).toHaveThingAt('yc-operand-blinker', 4);
    expect(operand).toHaveThingAt('yc-operand-selected', -1);
  });
  it('should handle leading zeros correctly', function () {
    var operand = new YC.Operand();
    operand.insertDigit(0);
    expect(operand).toHaveThingAt('yc-operand-blinker', 0);
    expect(operand).toHaveThingAt('yc-operand-selected', -1);
    operand.insertDigit(0);
    expect(operand).toHaveThingAt('yc-operand-blinker', -1);
    expect(operand).toHaveThingAt('yc-operand-selected', 0);
    operand.insertDigit(1);
    expect(operand).toHaveThingAt('yc-operand-blinker', -1);
    expect(operand).toHaveThingAt('yc-operand-selected', 1);
    operand.deleteLastDigit();
    operand.insertDigit(0);
    expect(operand).toHaveThingAt('yc-operand-blinker', -1);
    expect(operand).toHaveThingAt('yc-operand-selected', 0);
  });
});
