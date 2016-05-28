'use strict';

require.config({
  map: {
    '*': {
      'css': 'node_modules/require-css/css',
      'text': 'node_modules/text/text',
      'm': 'node_modules/mithril/mithril',
      'FastClick': 'node_modules/fastclick/lib/fastclick'
    }
  }
});

require([
  './yc',
  './app',
  'css!./styles/fonts',
  'css!./styles/global',
  'css!./styles/button',
  'css!./styles/layout',
  'css!./styles/theme'
], function (YC) {

  // eslint-disable-next-line no-new
  new YC.App({
    element: document.querySelector('.yc-app')
  });

});

require(['FastClick'], function (FastClick) {
  FastClick.attach(document.body);
});
