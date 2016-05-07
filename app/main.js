'use strict';

require([
  'YC',
  'YC App',
  'css!YC Global Styles',
  'css!YC Button Styles',
  'css!YC Layout Styles'
], function (YC) {

  // eslint-disable-next-line no-new
  new YC.App({
    element: document.body
  });

});

require(['FastClick'], function (FastClick) {
  FastClick.attach(document.body);
});
