/* eslint-env mocha */

import Operand from './operand';

describe('Operand', function () {

  beforeEach(function () {

    expect.extend({
      toHaveOperandThingAt(received, thing, expected) {
        const view = received.view();
        let actual = -1;
        const isThing = (child) => {
          return typeof child === 'object' &&
            new RegExp(thing).test(child.attrs.className);
        };
        view.children.some((child, index) => {
          if (isThing(child)) {
            actual = index;
            return true;
          }
          return false;
        });
        const pass = actual === expected;
        if (pass) {
          return {
            message: () => `Expected operand not to have a ${thing} at ${expected}`,
            pass: true,
          };
        } else {
          return {
            message: () => `Expected operand to have a ${thing} at ${expected}, but it was at ${actual}`,
            pass: false,
          };
        }
      },

      toHaveOperandDigits(received, expected) {
        const view = received.view();
        const actual = view.children.reduce((total, child) => {
          if (/yc-operand-digit/.test(child.attrs.className)) {
            return total + 1;
          }
          return total;
        }, 0);
        const pass = actual === expected;
        if (pass) {
          return {
            message: () => `Expected operand not to have ${expected} digits`,
            pass: true,
          };
        } else {
          return {
            message: () => `Expected operand to have ${expected} digits, but it had ${actual}`,
            pass: false,
          };
        }
      }
    });

  });

  it('should build up values', function () {
    var operand = new Operand();
    expect(operand.getValue()).toEqual('00');
    operand.insertDigit(1);
    expect(operand.getValue()).toEqual('100');
    operand.insertDigit(2);
    expect(operand.getValue()).toEqual('1200');
    operand.insertDigit(3);
    expect(operand.getValue()).toEqual('1230');
    operand.insertDigit(4);
    expect(operand.getValue()).toEqual('1234');
    operand.insertDigit(5);
    expect(operand.getValue()).toEqual('12345');
    operand.insertDigit(6);
    expect(operand.getValue()).toEqual('12345');
  });

  it('should transition from blinker, to selected, to blinker, to none', function () {
    var operand = new Operand();
    expect(operand).toHaveOperandDigits(2);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 0);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(1);
    expect(operand).toHaveOperandDigits(3);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 1);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(2);
    expect(operand).toHaveOperandDigits(4);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', -1);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', 2);
    operand.insertDigit(3);
    expect(operand).toHaveOperandDigits(4);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', -1);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', 3);
    operand.insertDigit(4);
    expect(operand).toHaveOperandDigits(4);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 4);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(5);
    expect(operand).toHaveOperandDigits(5);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', -1);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(6);
    expect(operand).toHaveOperandDigits(5);
  });

  it('should delete the first initial zero', function () {
    var operand = new Operand();
    expect(operand.getValue()).toEqual('00');
    operand.deleteLastDigit();
    expect(operand.getValue()).toEqual('0');
    operand.insertDigit(1);
    expect(operand.getValue()).toEqual('10');
    operand.insertDigit(2);
    expect(operand.getValue()).toEqual('120');
    operand.insertDigit(3);
    expect(operand.getValue()).toEqual('123');
    operand.insertDigit(4);
    expect(operand.getValue()).toEqual('1234');
    operand.insertDigit(5);
    expect(operand.getValue()).toEqual('12345');
    operand.insertDigit(6);
    expect(operand.getValue()).toEqual('12345');
  });

  it('should account for the first deleted initial zero when transitioning', function () {
    var operand = new Operand();
    expect(operand).toHaveOperandDigits(2);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 0);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.deleteLastDigit();
    expect(operand).toHaveOperandDigits(1);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 0);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(1);
    expect(operand).toHaveOperandDigits(2);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 1);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(2);
    expect(operand).toHaveOperandDigits(3);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', -1);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', 2);
    operand.insertDigit(3);
    expect(operand).toHaveOperandDigits(3);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 3);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(4);
    expect(operand).toHaveOperandDigits(4);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 4);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(5);
    expect(operand).toHaveOperandDigits(5);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', -1);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(6);
    expect(operand).toHaveOperandDigits(5);
  });

  it('should delete both initial zeros', function () {
    var operand = new Operand();
    expect(operand.getValue()).toEqual('00');
    operand.deleteLastDigit();
    expect(operand.getValue()).toEqual('0');
    operand.deleteLastDigit();
    expect(operand.getValue()).toEqual('');
    operand.insertDigit(1);
    expect(operand.getValue()).toEqual('1');
    operand.insertDigit(2);
    expect(operand.getValue()).toEqual('12');
    operand.insertDigit(3);
    expect(operand.getValue()).toEqual('123');
    operand.insertDigit(4);
    expect(operand.getValue()).toEqual('1234');
    operand.insertDigit(5);
    expect(operand.getValue()).toEqual('12345');
    operand.insertDigit(6);
    expect(operand.getValue()).toEqual('12345');
  });

  it('should account for both deleted initial zeros when transitioning', function () {
    var operand = new Operand();
    expect(operand).toHaveOperandDigits(2);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 0);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.deleteLastDigit();
    expect(operand).toHaveOperandDigits(1);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 0);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.deleteLastDigit();
    expect(operand).toHaveOperandDigits(0);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 0);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(1);
    expect(operand).toHaveOperandDigits(1);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 1);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(2);
    expect(operand).toHaveOperandDigits(2);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 2);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(3);
    expect(operand).toHaveOperandDigits(3);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 3);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(4);
    expect(operand).toHaveOperandDigits(4);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', 4);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(5);
    expect(operand).toHaveOperandDigits(5);
    expect(operand).toHaveOperandThingAt('yc-operand-blinker', -1);
    expect(operand).toHaveOperandThingAt('yc-operand-selected', -1);
    operand.insertDigit(6);
    expect(operand).toHaveOperandDigits(5);
  });

});
