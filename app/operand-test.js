/* eslint-env mocha */

'use strict';

define(['YC', 'YC Operand'], function (YC) {

  describe('operand', function () {

    beforeEach(function () {

      Assertion.addMethod('operandThingAt', function (thing, expected) {
        var method = this; // eslint-disable-line no-invalid-this
        var operand = method._obj;
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
          return false;
        });
        method.assert(
          actual === expected,
          'Expected operand to have a ' + thing + ' at ' + expected +
            ', but it was at ' + actual,
          'Expected operand not to have a ' + thing + ' at ' + expected
        );
      });

    });

    it('should build up values', function () {
      var operand = new YC.Operand();
      expect(operand.getValue()).to.equal('00');
      operand.insertDigit(1);
      expect(operand.getValue()).to.equal('100');
      operand.insertDigit(2);
      expect(operand.getValue()).to.equal('1200');
      operand.insertDigit(3);
      expect(operand.getValue()).to.equal('1230');
    });

    it('should transition from blinker, to selected, to blinker, to none', function () {
      var operand = new YC.Operand();
      expect(operand).to.have.operandThingAt('yc-operand-blinker', 0);
      expect(operand).to.have.operandThingAt('yc-operand-selected', -1);
      operand.insertDigit(1);
      expect(operand).to.have.operandThingAt('yc-operand-blinker', 1);
      expect(operand).to.have.operandThingAt('yc-operand-selected', -1);
      operand.insertDigit(2);
      expect(operand).to.have.operandThingAt('yc-operand-blinker', -1);
      expect(operand).to.have.operandThingAt('yc-operand-selected', 2);
      operand.insertDigit(3);
      expect(operand).to.have.operandThingAt('yc-operand-blinker', -1);
      expect(operand).to.have.operandThingAt('yc-operand-selected', 3);
      operand.insertDigit(4);
      expect(operand).to.have.operandThingAt('yc-operand-blinker', 4);
      expect(operand).to.have.operandThingAt('yc-operand-selected', -1);
    });

    it('should handle leading zeros correctly', function () {
      var operand = new YC.Operand();
      operand.insertDigit(0);
      expect(operand).to.have.operandThingAt('yc-operand-blinker', 0);
      expect(operand).to.have.operandThingAt('yc-operand-selected', -1);
      operand.insertDigit(0);
      expect(operand).to.have.operandThingAt('yc-operand-blinker', -1);
      expect(operand).to.have.operandThingAt('yc-operand-selected', 0);
      operand.insertDigit(1);
      expect(operand).to.have.operandThingAt('yc-operand-blinker', -1);
      expect(operand).to.have.operandThingAt('yc-operand-selected', 1);
      operand.deleteLastDigit();
      operand.insertDigit(0);
      expect(operand).to.have.operandThingAt('yc-operand-blinker', -1);
      expect(operand).to.have.operandThingAt('yc-operand-selected', 0);
    });

  });

});
