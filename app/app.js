'use strict';

var ycMakeApp = function () {
  var app = {};
  var players = ycTimes(2, function () {
    return ycMakePlayer();
  });
  var operand = ycMakeOperand();
  var lps = players.map(function (player) {
    return ycMakeLp({
      player: player,
      operand: operand
    });
  });
  var layout = ycMakeLayout({
    operand: operand,
    lps: lps
  });
  var onKeydown = function (event) {
    var keyCode = event.keyCode;
    if (keyCode === 8) { // backspace
      event.preventDefault(); // Don't navigate back one page.
      m.startComputation();
      operand.deleteLastDigit();
      m.endComputation();
    } else if (keyCode >= 48 && keyCode <= 57) {
      var digit = keyCode - 48;
      m.startComputation();
      operand.insertDigit(digit);
      m.endComputation();
    }
  };
  document.addEventListener('keydown', onKeydown);
  m.mount(document.body, { view: layout.view });
  app.destroy = function () {
    document.removeEventListener('keydown', onKeydown);
    m.mount(document.body, null);
  };
  return app;
};
