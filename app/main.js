'use strict';

require([
  './yc',
  './app',
  'css!./global.css',
  'css!./button.css',
  'css!./layout.css',
  'css!./theme.css'
], function (YC) {

  // eslint-disable-next-line no-new
  new YC.App({
    element: document.body
  });

});

require(['FastClick'], function (FastClick) {
  FastClick.attach(document.body);
});
