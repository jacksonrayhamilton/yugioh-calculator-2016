'use strict';

describe('operand', function () {
  it('should build up values', function () {
    var operand = ycMakeOperand();
    expect(operand.getValue()).toBe('00');
    operand.insertDigit(1);
    expect(operand.getValue()).toBe('100');
    operand.insertDigit(2);
    expect(operand.getValue()).toBe('1200');
    operand.insertDigit(3);
    expect(operand.getValue()).toBe('1230');
  });
});
