/* global ga */

'use strict';

var Analytics = {};

Analytics.queue = function () {
  if (location.host !== 'www.yugiohcalculator.com') {
    return undefined;
  }
  return ga.apply(this, arguments);
};

Analytics.event = function (eventCategory, eventAction) {
  return Analytics.queue('send', 'event', {
    eventCategory: eventCategory,
    eventAction: eventAction
  });
};

module.exports = Analytics;
