import App from './app';
import attachFastClick from 'fastclick';

// Initialize the application.

// eslint-disable-next-line no-new
new App({
  element: document.querySelector('.yc-app')
});

attachFastClick(document.body);
