'use strict';

define(['./yc'], function (YC) {

  /**
   * Pads a 2-digit number with a leading zero, if needed.
   */
  var pad = function (number) {
    return number < 10 ? '0' + number : String(number);
  };

  /**
   * Gets a timestamp.
   */
  YC.getTimestamp = function (ms) {
    return new Date(ms).toLocaleTimeString();
  };

  /**
   * Formats milliseconds as "00:00" (MINS:SECS).
   */
  YC.formatMs = function (ms) {
    // Round to make for a more-accurate end result.
    ms = Math.round(ms / 1000) * 1000;
    var seconds = Math.floor(ms / 1000) % 60;
    var minutes = Math.floor(ms / 60000);
    return pad(minutes) + ':' + pad(seconds);
  };

  /**
   * Get the first millisecond value (midnight) for the day represented by `ms`.
   */
  YC.startOfDay = function (ms) {
    var date = new Date(ms);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };

  /**
   * Get a representation of the current day.
   */
  YC.getDaystamp = function (ms) {
    return new Date(ms).toLocaleDateString();
  };

});
