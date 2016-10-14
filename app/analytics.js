/* global ga */

'use strict';

// Record user behavior for application enchancement (using Google Analytics).
var Analytics = {};

// Send an event to the analytics backend.
Analytics.queue = function () {
  if (location.host !== 'www.yugiohcalculator.com') {
    return undefined;
  }
  return ga.apply(this, arguments);
};

// Record an action in some category of actions.
Analytics.event = function (eventCategory, eventAction) {
  return Analytics.queue('send', 'event', {
    eventCategory: eventCategory,
    eventAction: eventAction
  });
};

module.exports = Analytics;
