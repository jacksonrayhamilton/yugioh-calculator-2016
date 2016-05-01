'use strict';

require.config({
  map: {
    '*': {
      'css': 'node_modules/require-css/css'
    }
  },
  paths: {
    'm': 'node_modules/mithril/mithril',
    'FastClick': 'node_modules/fastclick/lib/fastclick',
    'YC': 'module',
    'YC App': 'app',
    'YC Calc': 'calc',
    'YC Digit': 'digit',
    'YC Digit Styles': 'digit',
    'YC Events': 'events',
    'YC History': 'history',
    'YC History Styles': 'history',
    'YC Lp': 'lp',
    'YC Lp Styles': 'lp',
    'YC Operand': 'operand',
    'YC Operand Styles': 'operand',
    'YC Persistence': 'persistence',
    'YC Player': 'player',
    'YC Time': 'time',
    'YC Timer': 'timer',
    'YC Timer Styles': 'timer',
    'YC Undos': 'undos',
    'YC Utils': 'utils',
    'YC Global Styles': 'global',
    'YC Button Styles': 'button',
    'YC Layout Styles': 'layout'
  }
});

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
