'use strict';

var App = require('./app');
var attachFastClick = require('fastclick');

// eslint-disable-next-line no-new
new App({
  element: document.querySelector('.yc-app')
});

attachFastClick(document.body);
