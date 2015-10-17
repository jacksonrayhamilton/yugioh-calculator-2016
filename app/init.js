'use strict';

var players = ycTimes(2, function () {
  return ycMakePlayer();
});

var operand = ycMakeOperand();

FastClick.attach(document.body);
