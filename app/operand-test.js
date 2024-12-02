/* eslint-env mocha */

import Operand from './operand';

describe('Operand', function () {

  beforeEach(function () {

    Assertion.addMethod('operandThingAt', function (thing, expected) {
      var method = this;
      var operand = method._obj;
      var view = operand.view();
      var actual = -1;
      var isThing = function (child) {
        return typeof child === 'object' &&
          new RegExp(thing).test(child.attrs.className);
      };
      view.children.some(function (child, index) {
        if (isThing(child)) {
          actual = index;
          return true;
        }
        return false;
      });
      method.assert(
        actual === expected,
        'Expected operand to have a ' + thing + ' at ' + expected +
          ', but it was at ' + actual,
        'Expected operand not to have a ' + thing + ' at ' + expected
      );
    });

    Assertion.addMethod('operandDigits', function (expected) {
      var method = this;
      var operand = method._obj;
      var view = operand.view();
      var actual = view.children.reduce(function (total, child) {
        if (/yc-operand-digit/.test(child.attrs.className)) {
          return total + 1;
        }
        return total;
      }, 0);
      method.assert(
        actual === expected,
        'Expected operand to have ' + expected + ' digits, ' +
          'but it had ' + actual,
        'Expected operand not to have ' + expected + ' digits'
      );
    });

  });

  it('should build up values', function () {
    var operand = new Operand();
    expect(operand.getValue()).to.equal('00');
    operand.insertDigit(1);
    expect(operand.getValue()).to.equal('100');
    operand.insertDigit(2);
    expect(operand.getValue()).to.equal('1200');
    operand.insertDigit(3);
    expect(operand.getValue()).to.equal('1230');
  });

  it('should transition from blinker, to selected, to blinker, to none', function () {
    var operand = new Operand();
    expect(operand).to.have.operandDigits(2);
    expect(operand).to.have.operandThingAt('yc-operand-blinker', 0);
    expect(operand).to.have.operandThingAt('yc-operand-selected', -1);
    operand.insertDigit(1);
    expect(operand).to.have.operandDigits(3);
    expect(operand).to.have.operandThingAt('yc-operand-blinker', 1);
    expect(operand).to.have.operandThingAt('yc-operand-selected', -1);
    operand.insertDigit(2);
    expect(operand).to.have.operandDigits(4);
    expect(operand).to.have.operandThingAt('yc-operand-blinker', -1);
    expect(operand).to.have.operandThingAt('yc-operand-selected', 2);
    operand.insertDigit(3);
    expect(operand).to.have.operandDigits(4);
    expect(operand).to.have.operandThingAt('yc-operand-blinker', -1);
    expect(operand).to.have.operandThingAt('yc-operand-selected', 3);
    operand.insertDigit(4);
    expect(operand).to.have.operandDigits(4);
    expect(operand).to.have.operandThingAt('yc-operand-blinker', 4);
    expect(operand).to.have.operandThingAt('yc-operand-selected', -1);
    operand.insertDigit(5);
    expect(operand).to.have.operandDigits(5);
    expect(operand).to.have.operandThingAt('yc-operand-blinker', -1);
    expect(operand).to.have.operandThingAt('yc-operand-selected', -1);
    operand.insertDigit(6);
    expect(operand).to.have.operandDigits(5);
  });

});
