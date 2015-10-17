'use strict';

var ycMakeLayout = function (spec) {
  spec = spec === undefined ? {} : spec;
  var layout = {};
  var lps = spec.lps;
  var operand = spec.operand;
  layout.view = function () {
    return [].concat(
      lps.map(function (lp) {
        return lp.view();
      }),
      operand.view()
    );
  };
  return layout;
};
