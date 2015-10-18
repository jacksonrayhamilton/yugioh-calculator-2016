'use strict';

var ycMakeCancel = function (spec) {
  spec = spec === undefined ? {} : spec;
  var cancel = {};
  var operand = spec.operand;
  var clear = function () {
    operand.reset();
  };
  cancel.view = function () {
    return m('.yc-cancel', { onclick: clear }, 'C');
  };
  return cancel;
};
