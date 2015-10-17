'use strict';

var ycMakeLayout = function (spec) {
  spec = spec === undefined ? {} : spec;
  var layout = {};
  var lps = spec.lps;
  var digits = spec.digits;
  var operand = spec.operand;
  layout.view = function () {
    return [].concat(
      lps.map(function (lp) {
        return lp.view();
      }),
      operand.view(),
      ycTimes(2, function (n) {
        var someDigits = digits.slice(n * 5, (n * 5) + 5);
        var views = someDigits.map(function (digit) {
          return digit.view();
        });
        return m('.yc-layout-digits', views);
      })
    );
  };
  return layout;
};
