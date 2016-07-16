/* global ga */

'use strict';

define(['./yc'], function (YC) {

  YC.Analytics = {};

  YC.Analytics.queue = function () {
    if (location.host !== 'www.yugiohcalculator.com') {
      // eslint-disable-next-line no-console
      console.log.apply(console, ['Queued:'].concat(Array.prototype.slice.call(arguments)));
      return undefined;
    }
    return ga.apply(this, arguments);
  };

  YC.Analytics.event = function (eventCategory, eventAction) {
    return YC.Analytics.queue('send', 'event', {
      eventCategory: eventCategory,
      eventAction: eventAction
    });
  };

});
