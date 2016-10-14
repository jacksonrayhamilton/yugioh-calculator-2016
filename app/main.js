'use strict';

var App = require('./app');
var attachFastClick = require('fastclick');

// Initialize the application.

// eslint-disable-next-line no-new
new App({
  element: document.querySelector('.yc-app')
});

attachFastClick(document.body);
